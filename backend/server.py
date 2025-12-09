from fastapi import FastAPI, APIRouter, File, UploadFile, HTTPException
from fastapi.responses import FileResponse, StreamingResponse
from dotenv import load_dotenv
from starlette.middleware.cors import CORSMiddleware
from motor.motor_asyncio import AsyncIOMotorClient
import os
import logging
from pathlib import Path
from pydantic import BaseModel, Field, ConfigDict
from typing import List, Optional, Dict, Any
import uuid
from datetime import datetime, timezone
import pandas as pd
import numpy as np
import io
import json
import base64
import matplotlib
matplotlib.use('Agg')
import matplotlib.pyplot as plt
import seaborn as sns

ROOT_DIR = Path(__file__).parent
load_dotenv(ROOT_DIR / '.env')

# MongoDB connection
mongo_url = os.environ['MONGO_URL']
client = AsyncIOMotorClient(mongo_url)
db = client[os.environ['DB_NAME']]

# Create uploads directory
UPLOADS_DIR = ROOT_DIR / 'uploads'
UPLOADS_DIR.mkdir(exist_ok=True)

# Create the main app without a prefix
app = FastAPI()

# Create a router with the /api prefix
api_router = APIRouter(prefix="/api")

# Define Models
class FileAnalysis(BaseModel):
    model_config = ConfigDict(extra="ignore")
    
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    filename: str
    file_type: str
    rows: int
    columns: int
    column_info: Dict[str, Any]
    null_values: Dict[str, int]
    describe_stats: Dict[str, Any]
    timestamp: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

class NullHandlingRequest(BaseModel):
    file_id: str
    method: str  # 'drop', 'mean', 'median', 'mode', 'forward_fill', 'backward_fill'
    columns: Optional[List[str]] = None

class VisualizationRequest(BaseModel):
    file_id: str
    chart_type: str  # 'histogram', 'scatter', 'bar', 'box', 'correlation', 'line'
    x_column: Optional[str] = None
    y_column: Optional[str] = None
    columns: Optional[List[str]] = None

class ConvertRequest(BaseModel):
    file_id: str
    target_format: str  # 'csv', 'json', 'excel'

@api_router.get("/")
async def root():
    return {"message": "FileBuddy API - Smart File Analyzer"}

@api_router.post("/upload", response_model=FileAnalysis)
async def upload_file(file: UploadFile = File(...)):
    try:
        # Read file content
        content = await file.read()
        file_id = str(uuid.uuid4())
        
        # Determine file type and read with pandas
        filename = file.filename.lower()
        if filename.endswith('.csv'):
            df = pd.read_csv(io.BytesIO(content))
            file_type = 'csv'
        elif filename.endswith('.json'):
            df = pd.read_json(io.BytesIO(content))
            file_type = 'json'
        elif filename.endswith(('.xlsx', '.xls')):
            df = pd.read_excel(io.BytesIO(content))
            file_type = 'excel'
        else:
            raise HTTPException(status_code=400, detail="Unsupported file format. Please upload CSV, JSON, or Excel files.")
        
        # Save file to disk
        file_path = UPLOADS_DIR / f"{file_id}.pkl"
        df.to_pickle(file_path)
        
        # Analyze the dataframe
        column_info = {}
        for col in df.columns:
            column_info[col] = {
                'dtype': str(df[col].dtype),
                'non_null_count': int(df[col].count()),
                'null_count': int(df[col].isna().sum()),
                'unique_values': int(df[col].nunique())
            }
        
        # Get null values per column
        null_values = {col: int(df[col].isna().sum()) for col in df.columns}
        
        # Get describe statistics for numeric columns
        describe_dict = {}
        numeric_cols = df.select_dtypes(include=[np.number]).columns.tolist()
        if numeric_cols:
            desc = df[numeric_cols].describe()
            describe_dict = desc.to_dict()
            # Convert numpy types to Python types
            for col in describe_dict:
                for stat in describe_dict[col]:
                    if isinstance(describe_dict[col][stat], (np.integer, np.floating)):
                        describe_dict[col][stat] = float(describe_dict[col][stat])
        
        # Create analysis object
        analysis = FileAnalysis(
            id=file_id,
            filename=file.filename,
            file_type=file_type,
            rows=len(df),
            columns=len(df.columns),
            column_info=column_info,
            null_values=null_values,
            describe_stats=describe_dict
        )
        
        # Store in MongoDB
        doc = analysis.model_dump()
        doc['timestamp'] = doc['timestamp'].isoformat()
        await db.file_analyses.insert_one(doc)
        
        return analysis
    except Exception as e:
        logging.error(f"Error uploading file: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Error processing file: {str(e)}")

@api_router.get("/files/{file_id}", response_model=FileAnalysis)
async def get_file_analysis(file_id: str):
    analysis = await db.file_analyses.find_one({"id": file_id}, {"_id": 0})
    if not analysis:
        raise HTTPException(status_code=404, detail="File not found")
    
    if isinstance(analysis['timestamp'], str):
        analysis['timestamp'] = datetime.fromisoformat(analysis['timestamp'])
    
    return analysis

@api_router.post("/handle-nulls")
async def handle_null_values(request: NullHandlingRequest):
    try:
        file_path = UPLOADS_DIR / f"{request.file_id}.pkl"
        if not file_path.exists():
            raise HTTPException(status_code=404, detail="File not found")
        
        df = pd.read_pickle(file_path)
        
        # Apply null handling
        if request.method == 'drop':
            df = df.dropna(subset=request.columns if request.columns else None)
        elif request.method == 'mean':
            cols = request.columns if request.columns else df.select_dtypes(include=[np.number]).columns
            for col in cols:
                if col in df.columns and df[col].dtype in [np.float64, np.int64]:
                    df[col].fillna(df[col].mean(), inplace=True)
        elif request.method == 'median':
            cols = request.columns if request.columns else df.select_dtypes(include=[np.number]).columns
            for col in cols:
                if col in df.columns and df[col].dtype in [np.float64, np.int64]:
                    df[col].fillna(df[col].median(), inplace=True)
        elif request.method == 'mode':
            cols = request.columns if request.columns else df.columns
            for col in cols:
                if col in df.columns:
                    mode_val = df[col].mode()
                    if len(mode_val) > 0:
                        df[col].fillna(mode_val[0], inplace=True)
        elif request.method == 'forward_fill':
            df.ffill(inplace=True)
        elif request.method == 'backward_fill':
            df.bfill(inplace=True)
        
        # Save updated file
        df.to_pickle(file_path)
        
        # Update analysis
        null_values = {col: int(df[col].isna().sum()) for col in df.columns}
        await db.file_analyses.update_one(
            {"id": request.file_id},
            {"$set": {"null_values": null_values, "rows": len(df)}}
        )
        
        return {"message": "Null values handled successfully", "new_row_count": len(df)}
    except Exception as e:
        logging.error(f"Error handling nulls: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Error handling null values: {str(e)}")

@api_router.post("/visualize")
async def create_visualization(request: VisualizationRequest):
    try:
        file_path = UPLOADS_DIR / f"{request.file_id}.pkl"
        if not file_path.exists():
            raise HTTPException(status_code=404, detail="File not found")
        
        df = pd.read_pickle(file_path)
        
        # Create visualization
        plt.figure(figsize=(10, 6))
        try:
            plt.style.use('seaborn-v0_8-darkgrid')
        except OSError:
            # Fallback to default style if seaborn style not available
            plt.style.use('default')
            sns.set_style('darkgrid')
        
        if request.chart_type == 'histogram':
            if request.x_column and request.x_column in df.columns:
                plt.hist(df[request.x_column].dropna(), bins=30, color='#3B82F6', edgecolor='black', alpha=0.7)
                plt.xlabel(request.x_column)
                plt.ylabel('Frequency')
                plt.title(f'Histogram of {request.x_column}')
        
        elif request.chart_type == 'scatter':
            if request.x_column and request.y_column and request.x_column in df.columns and request.y_column in df.columns:
                plt.scatter(df[request.x_column], df[request.y_column], color='#3B82F6', alpha=0.6)
                plt.xlabel(request.x_column)
                plt.ylabel(request.y_column)
                plt.title(f'Scatter: {request.x_column} vs {request.y_column}')
        
        elif request.chart_type == 'bar':
            if request.x_column and request.x_column in df.columns:
                value_counts = df[request.x_column].value_counts().head(10)
                plt.bar(range(len(value_counts)), value_counts.values, color='#3B82F6')
                plt.xticks(range(len(value_counts)), value_counts.index, rotation=45, ha='right')
                plt.xlabel(request.x_column)
                plt.ylabel('Count')
                plt.title(f'Bar Chart of {request.x_column}')
        
        elif request.chart_type == 'box':
            if request.columns:
                numeric_cols = [col for col in request.columns if col in df.columns and df[col].dtype in [np.float64, np.int64]]
                if numeric_cols:
                    df[numeric_cols].boxplot()
                    plt.xticks(rotation=45, ha='right')
                    plt.title('Box Plot')
        
        elif request.chart_type == 'correlation':
            numeric_df = df.select_dtypes(include=[np.number])
            if len(numeric_df.columns) > 1:
                corr = numeric_df.corr()
                sns.heatmap(corr, annot=True, cmap='coolwarm', center=0, fmt='.2f', square=True)
                plt.title('Correlation Heatmap')
        
        elif request.chart_type == 'line':
            if request.x_column and request.y_column and request.x_column in df.columns and request.y_column in df.columns:
                plt.plot(df[request.x_column], df[request.y_column], color='#3B82F6', linewidth=2)
                plt.xlabel(request.x_column)
                plt.ylabel(request.y_column)
                plt.title(f'Line Chart: {request.x_column} vs {request.y_column}')
        
        plt.tight_layout()
        
        # Save to bytes
        buf = io.BytesIO()
        plt.savefig(buf, format='png', dpi=100, bbox_inches='tight')
        buf.seek(0)
        img_base64 = base64.b64encode(buf.read()).decode('utf-8')
        plt.close()
        
        return {"image": f"data:image/png;base64,{img_base64}"}
    except Exception as e:
        logging.error(f"Error creating visualization: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Error creating visualization: {str(e)}")

@api_router.post("/convert")
async def convert_file_format(request: ConvertRequest):
    try:
        file_path = UPLOADS_DIR / f"{request.file_id}.pkl"
        if not file_path.exists():
            raise HTTPException(status_code=404, detail="File not found")
        
        df = pd.read_pickle(file_path)
        
        # Get original filename
        analysis = await db.file_analyses.find_one({"id": request.file_id}, {"_id": 0})
        if not analysis:
            raise HTTPException(status_code=404, detail="File analysis not found")
        
        original_name = Path(analysis['filename']).stem
        
        # Convert to target format
        output_path = UPLOADS_DIR / f"{request.file_id}_converted"
        
        if request.target_format == 'csv':
            output_file = output_path.with_suffix('.csv')
            df.to_csv(output_file, index=False)
        elif request.target_format == 'json':
            output_file = output_path.with_suffix('.json')
            df.to_json(output_file, orient='records', indent=2)
        elif request.target_format == 'excel':
            output_file = output_path.with_suffix('.xlsx')
            df.to_excel(output_file, index=False, engine='openpyxl')
        else:
            raise HTTPException(status_code=400, detail="Unsupported format")
        
        return {
            "message": "File converted successfully",
            "download_id": f"{request.file_id}_converted",
            "filename": f"{original_name}.{request.target_format if request.target_format != 'excel' else 'xlsx'}"
        }
    except Exception as e:
        logging.error(f"Error converting file: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Error converting file: {str(e)}")

@api_router.get("/download/{download_id}")
async def download_file(download_id: str):
    # Find the file with matching download_id
    files = list(UPLOADS_DIR.glob(f"{download_id}.*"))
    if not files:
        raise HTTPException(status_code=404, detail="File not found")
    
    file_path = files[0]
    return FileResponse(file_path, filename=file_path.name, media_type='application/octet-stream')

@api_router.get("/files", response_model=List[FileAnalysis])
async def get_all_files():
    files = await db.file_analyses.find({}, {"_id": 0}).sort("timestamp", -1).to_list(100)
    
    for file in files:
        if isinstance(file['timestamp'], str):
            file['timestamp'] = datetime.fromisoformat(file['timestamp'])
    
    return files

@api_router.get("/sample-dataset/{dataset_type}")
async def get_sample_dataset(dataset_type: str):
    """Generate and return sample datasets for testing"""
    try:
        if dataset_type == 'sales':
            # Sales dataset
            np.random.seed(42)
            dates = pd.date_range('2024-01-01', periods=500, freq='D')
            products = ['Product A', 'Product B', 'Product C', 'Product D', 'Product E']
            regions = ['North', 'South', 'East', 'West']
            
            data = {
                'Date': np.random.choice(dates, 500),
                'Product': np.random.choice(products, 500),
                'Region': np.random.choice(regions, 500),
                'Quantity': np.random.randint(1, 100, 500),
                'Price': np.round(np.random.uniform(10, 500, 500), 2),
                'Revenue': np.round(np.random.uniform(100, 5000, 500), 2),
                'Customer_ID': np.random.randint(1000, 9999, 500)
            }
            df = pd.DataFrame(data)
            # Add some null values
            df.loc[np.random.choice(df.index, 30, replace=False), 'Quantity'] = np.nan
            df.loc[np.random.choice(df.index, 25, replace=False), 'Revenue'] = np.nan
            
        elif dataset_type == 'customer':
            # Customer dataset
            np.random.seed(43)
            ages = np.random.randint(18, 80, 300)
            genders = np.random.choice(['Male', 'Female', 'Other'], 300)
            
            data = {
                'Customer_ID': range(1, 301),
                'Age': ages,
                'Gender': genders,
                'Annual_Income': np.round(np.random.uniform(20000, 150000, 300), 2),
                'Purchase_Count': np.random.randint(1, 50, 300),
                'Satisfaction_Score': np.round(np.random.uniform(1, 5, 300), 1)
            }
            df = pd.DataFrame(data)
            # Add some null values
            df.loc[np.random.choice(df.index, 20, replace=False), 'Age'] = np.nan
            df.loc[np.random.choice(df.index, 15, replace=False), 'Satisfaction_Score'] = np.nan
            
        elif dataset_type == 'employee':
            # Employee dataset
            np.random.seed(44)
            departments = ['IT', 'Sales', 'Marketing', 'HR', 'Finance']
            positions = ['Junior', 'Mid', 'Senior', 'Lead', 'Manager']
            
            data = {
                'Employee_ID': range(1, 251),
                'Department': np.random.choice(departments, 250),
                'Position': np.random.choice(positions, 250),
                'Salary': np.round(np.random.uniform(30000, 120000, 250), 2),
                'Years_Experience': np.random.randint(0, 30, 250),
                'Performance_Score': np.round(np.random.uniform(1, 5, 250), 1),
                'Projects_Completed': np.random.randint(0, 50, 250),
                'Training_Hours': np.random.randint(0, 200, 250)
            }
            df = pd.DataFrame(data)
            # Add some null values
            df.loc[np.random.choice(df.index, 18, replace=False), 'Performance_Score'] = np.nan
            df.loc[np.random.choice(df.index, 12, replace=False), 'Training_Hours'] = np.nan
        else:
            raise HTTPException(status_code=404, detail="Sample dataset not found")
        
        # Convert to CSV
        csv_buffer = io.StringIO()
        df.to_csv(csv_buffer, index=False)
        csv_buffer.seek(0)
        
        return StreamingResponse(
            io.BytesIO(csv_buffer.getvalue().encode()),
            media_type='text/csv',
            headers={'Content-Disposition': f'attachment; filename=sample_{dataset_type}.csv'}
        )
    except Exception as e:
        logging.error(f"Error generating sample dataset: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Error generating sample dataset: {str(e)}")

# Include the router in the main app
app.include_router(api_router)

app.add_middleware(
    CORSMiddleware,
    allow_credentials=True,
    allow_origins=os.environ.get('CORS_ORIGINS', '*').split(','),
    allow_methods=["*"],
    allow_headers=["*"],
)

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

@app.on_event("shutdown")
async def shutdown_db_client():
    client.close()

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("server:app", host="0.0.0.0", port=8000, reload=True)