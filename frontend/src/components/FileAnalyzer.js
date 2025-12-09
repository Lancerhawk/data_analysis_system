import { useState } from 'react';
import { Upload, FileText, BarChart3, Download, AlertCircle, CheckCircle2, ArrowLeft } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { toast } from 'sonner';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

function FileAnalyzer() {
  const navigate = useNavigate();
  const [file, setFile] = useState(null);
  const [analysis, setAnalysis] = useState(null);
  const [loading, setLoading] = useState(false);
  const [currentStep, setCurrentStep] = useState(1);
  const [dragActive, setDragActive] = useState(false);
  const [visualization, setVisualization] = useState(null);
  const [convertedFile, setConvertedFile] = useState(null);

  const handleDrag = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true);
    } else if (e.type === 'dragleave') {
      setDragActive(false);
    }
  };

  const handleDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFileSelect(e.dataTransfer.files[0]);
    }
  };

  const handleFileSelect = async (selectedFile) => {
    setFile(selectedFile);
    setLoading(true);
    
    try {
      const formData = new FormData();
      formData.append('file', selectedFile);
      
      const response = await axios.post(`${API}/upload`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      
      setAnalysis(response.data);
      setCurrentStep(2);
      toast.success('File uploaded and analyzed successfully!');
    } catch (error) {
      console.error('Error uploading file:', error);
      toast.error(error.response?.data?.detail || 'Error uploading file');
    } finally {
      setLoading(false);
    }
  };

  const handleNullValues = async (method) => {
    setLoading(true);
    try {
      const response = await axios.post(`${API}/handle-nulls`, {
        file_id: analysis.id,
        method: method
      });
      
      const updatedAnalysis = await axios.get(`${API}/files/${analysis.id}`);
      setAnalysis(updatedAnalysis.data);
      toast.success(`Null values handled using ${method} method`);
    } catch (error) {
      console.error('Error handling nulls:', error);
      toast.error('Error handling null values');
    } finally {
      setLoading(false);
    }
  };

  const handleVisualize = async (chartType, xColumn, yColumn = null, columns = null) => {
    setLoading(true);
    try {
      const response = await axios.post(`${API}/visualize`, {
        file_id: analysis.id,
        chart_type: chartType,
        x_column: xColumn,
        y_column: yColumn,
        columns: columns
      });
      
      setVisualization(response.data.image);
      setCurrentStep(4);
      toast.success('Visualization created!');
    } catch (error) {
      console.error('Error creating visualization:', error);
      toast.error('Error creating visualization');
    } finally {
      setLoading(false);
    }
  };

  const handleConvert = async (format) => {
    setLoading(true);
    try {
      const response = await axios.post(`${API}/convert`, {
        file_id: analysis.id,
        target_format: format
      });
      
      setConvertedFile(response.data);
      toast.success(`File converted to ${format.toUpperCase()}`);
    } catch (error) {
      console.error('Error converting file:', error);
      toast.error('Error converting file');
    } finally {
      setLoading(false);
    }
  };

  const handleDownload = async () => {
    if (!convertedFile) return;
    
    try {
      const response = await axios.get(`${API}/download/${convertedFile.download_id}`, {
        responseType: 'blob'
      });
      
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', convertedFile.filename);
      document.body.appendChild(link);
      link.click();
      link.remove();
      toast.success('File downloaded successfully!');
    } catch (error) {
      console.error('Error downloading file:', error);
      toast.error('Error downloading file');
    }
  };

  const resetApp = () => {
    setFile(null);
    setAnalysis(null);
    setCurrentStep(1);
    setVisualization(null);
    setConvertedFile(null);
  };

  const getStepProgress = () => {
    return (currentStep / 5) * 100;
  };

  return (
    <div className="app-container">
      {/* Header */}
      <header className="app-header">
        <div className="header-content">
          <div className="logo-section">
            <FileText className="logo-icon" size={32} />
            <h1 className="logo-text">FileBuddy</h1>
          </div>
          <p className="header-subtitle">Smart File Analyzer & Data Processing Tool</p>
        </div>
        <Button 
          data-testid="back-home-btn" 
          onClick={() => navigate('/')} 
          variant="outline" 
          className="back-btn"
        >
          <ArrowLeft size={16} className="mr-2" />
          Back to Home
        </Button>
      </header>

      {/* Progress Bar */}
      {analysis && (
        <div className="progress-container">
          <div className="progress-wrapper">
            <div className="progress-steps">
              <div className={`progress-step ${currentStep >= 1 ? 'active' : ''}`}>
                <div className="step-circle">1</div>
                <span className="step-label">Upload</span>
              </div>
              <div className={`progress-step ${currentStep >= 2 ? 'active' : ''}`}>
                <div className="step-circle">2</div>
                <span className="step-label">Analyze</span>
              </div>
              <div className={`progress-step ${currentStep >= 3 ? 'active' : ''}`}>
                <div className="step-circle">3</div>
                <span className="step-label">Clean</span>
              </div>
              <div className={`progress-step ${currentStep >= 4 ? 'active' : ''}`}>
                <div className="step-circle">4</div>
                <span className="step-label">Visualize</span>
              </div>
              <div className={`progress-step ${currentStep >= 5 ? 'active' : ''}`}>
                <div className="step-circle">5</div>
                <span className="step-label">Export</span>
              </div>
            </div>
            <Progress value={getStepProgress()} className="progress-bar" />
          </div>
        </div>
      )}

      {/* Main Content */}
      <main className="main-content">
        {!analysis ? (
          <div className="upload-section">
            <Card className="upload-card">
              <CardHeader>
                <CardTitle>Upload Your Dataset</CardTitle>
                <CardDescription>Support for CSV, JSON, and Excel files</CardDescription>
              </CardHeader>
              <CardContent>
                <div
                  className={`upload-area ${dragActive ? 'drag-active' : ''}`}
                  onDragEnter={handleDrag}
                  onDragLeave={handleDrag}
                  onDragOver={handleDrag}
                  onDrop={handleDrop}
                  data-testid="file-upload-area"
                >
                  <Upload className="upload-icon" size={48} />
                  <h3 className="upload-title">Drag & Drop your file here</h3>
                  <p className="upload-subtitle">or</p>
                  <label htmlFor="file-input">
                    <Button data-testid="browse-file-btn" className="browse-btn" disabled={loading}>
                      {loading ? 'Uploading...' : 'Browse Files'}
                    </Button>
                  </label>
                  <input
                    id="file-input"
                    type="file"
                    accept=".csv,.json,.xlsx,.xls"
                    onChange={(e) => e.target.files[0] && handleFileSelect(e.target.files[0])}
                    style={{ display: 'none' }}
                    data-testid="file-input"
                  />
                  <p className="file-types">Supported: CSV, JSON, Excel (.xlsx, .xls)</p>
                </div>
              </CardContent>
            </Card>
          </div>
        ) : (
          <div className="analysis-section">
            <div className="analysis-header">
              <div>
                <h2 className="analysis-title">{analysis.filename}</h2>
                <div className="analysis-meta">
                  <Badge variant="secondary">{analysis.file_type.toUpperCase()}</Badge>
                  <span className="meta-text">{analysis.rows} rows × {analysis.columns} columns</span>
                </div>
              </div>
              <Button data-testid="new-file-btn" onClick={resetApp} variant="outline">
                <Upload size={16} className="mr-2" />
                New File
              </Button>
            </div>

            <Tabs defaultValue="overview" className="analysis-tabs">
              <TabsList className="tabs-list">
                <TabsTrigger value="overview" data-testid="overview-tab">Overview</TabsTrigger>
                <TabsTrigger value="nulls" data-testid="nulls-tab">Handle Nulls</TabsTrigger>
                <TabsTrigger value="visualize" data-testid="visualize-tab">Visualize</TabsTrigger>
                <TabsTrigger value="export" data-testid="export-tab">Export</TabsTrigger>
              </TabsList>

              <TabsContent value="overview" className="tab-content">
                <Card>
                  <CardHeader>
                    <CardTitle>Dataset Overview</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="overview-grid">
                      <div className="overview-item">
                        <h4>Column Information</h4>
                        <div className="column-list">
                          {Object.entries(analysis.column_info).map(([col, info]) => (
                            <div key={col} className="column-item">
                              <div className="column-name">
                                <span className="font-semibold">{col}</span>
                                <Badge variant="outline" className="ml-2">{info.dtype}</Badge>
                              </div>
                              <div className="column-stats">
                                <span>Non-null: {info.non_null_count}</span>
                                {info.null_count > 0 && (
                                  <span className="text-red-600 flex items-center gap-1">
                                    <AlertCircle size={14} />
                                    Nulls: {info.null_count}
                                  </span>
                                )}
                                <span>Unique: {info.unique_values}</span>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>

                      {Object.keys(analysis.describe_stats).length > 0 && (
                        <div className="overview-item">
                          <h4>Statistical Summary</h4>
                          <div className="stats-table">
                            <table>
                              <thead>
                                <tr>
                                  <th>Statistic</th>
                                  {Object.keys(analysis.describe_stats).map(col => (
                                    <th key={col}>{col}</th>
                                  ))}
                                </tr>
                              </thead>
                              <tbody>
                                {['mean', 'std', 'min', '25%', '50%', '75%', 'max'].map(stat => (
                                  <tr key={stat}>
                                    <td className="font-semibold">{stat}</td>
                                    {Object.keys(analysis.describe_stats).map(col => (
                                      <td key={col}>
                                        {analysis.describe_stats[col][stat]?.toFixed(2) || 'N/A'}
                                      </td>
                                    ))}
                                  </tr>
                                ))}
                              </tbody>
                            </table>
                          </div>
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="nulls" className="tab-content">
                <Card>
                  <CardHeader>
                    <CardTitle>Handle Missing Values</CardTitle>
                    <CardDescription>Choose a method to handle null values in your dataset</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="nulls-summary">
                      <h4>Null Values Summary</h4>
                      <div className="nulls-list">
                        {Object.entries(analysis.null_values).map(([col, count]) => (
                          <div key={col} className="null-item">
                            <span className="null-col">{col}</span>
                            {count > 0 ? (
                              <Badge variant="destructive">{count} nulls</Badge>
                            ) : (
                              <Badge variant="default" className="bg-green-600">
                                <CheckCircle2 size={14} className="mr-1" />
                                Clean
                              </Badge>
                            )}
                          </div>
                        ))}
                      </div>
                    </div>

                    <Separator className="my-6" />

                    <div className="null-methods">
                      <h4>Select Handling Method</h4>
                      <div className="method-grid">
                        <Button
                          data-testid="drop-rows-btn"
                          onClick={() => handleNullValues('drop')}
                          disabled={loading}
                          variant="outline"
                          className="method-btn"
                        >
                          Drop Rows
                        </Button>
                        <Button
                          data-testid="fill-mean-btn"
                          onClick={() => handleNullValues('mean')}
                          disabled={loading}
                          variant="outline"
                          className="method-btn"
                        >
                          Fill with Mean
                        </Button>
                        <Button
                          data-testid="fill-median-btn"
                          onClick={() => handleNullValues('median')}
                          disabled={loading}
                          variant="outline"
                          className="method-btn"
                        >
                          Fill with Median
                        </Button>
                        <Button
                          data-testid="fill-mode-btn"
                          onClick={() => handleNullValues('mode')}
                          disabled={loading}
                          variant="outline"
                          className="method-btn"
                        >
                          Fill with Mode
                        </Button>
                        <Button
                          data-testid="forward-fill-btn"
                          onClick={() => handleNullValues('forward_fill')}
                          disabled={loading}
                          variant="outline"
                          className="method-btn"
                        >
                          Forward Fill
                        </Button>
                        <Button
                          data-testid="backward-fill-btn"
                          onClick={() => handleNullValues('backward_fill')}
                          disabled={loading}
                          variant="outline"
                          className="method-btn"
                        >
                          Backward Fill
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="visualize" className="tab-content">
                <Card>
                  <CardHeader>
                    <CardTitle>Create Visualizations</CardTitle>
                    <CardDescription>Generate charts to understand your data better</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <VisualizationPanel
                      analysis={analysis}
                      onVisualize={handleVisualize}
                      loading={loading}
                      visualization={visualization}
                    />
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="export" className="tab-content">
                <Card>
                  <CardHeader>
                    <CardTitle>Export Your Data</CardTitle>
                    <CardDescription>Convert and download your processed dataset</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="export-section">
                      <div className="export-options">
                        <h4>Select Export Format</h4>
                        <div className="format-grid">
                          <Button
                            data-testid="export-csv-btn"
                            onClick={() => handleConvert('csv')}
                            disabled={loading}
                            variant="outline"
                            className="format-btn"
                          >
                            <FileText size={20} className="mr-2" />
                            CSV
                          </Button>
                          <Button
                            data-testid="export-json-btn"
                            onClick={() => handleConvert('json')}
                            disabled={loading}
                            variant="outline"
                            className="format-btn"
                          >
                            <FileText size={20} className="mr-2" />
                            JSON
                          </Button>
                          <Button
                            data-testid="export-excel-btn"
                            onClick={() => handleConvert('excel')}
                            disabled={loading}
                            variant="outline"
                            className="format-btn"
                          >
                            <FileText size={20} className="mr-2" />
                            Excel
                          </Button>
                        </div>
                      </div>

                      {convertedFile && (
                        <div className="download-section">
                          <Separator className="my-6" />
                          <div className="download-ready">
                            <CheckCircle2 className="check-icon" size={32} />
                            <h4>File Ready for Download</h4>
                            <p className="download-filename">{convertedFile.filename}</p>
                            <Button
                              data-testid="download-btn"
                              onClick={handleDownload}
                              className="download-btn"
                            >
                              <Download size={20} className="mr-2" />
                              Download File
                            </Button>
                          </div>
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>
            </Tabs>
          </div>
        )}
      </main>

      {/* Footer */}
      <footer className="app-footer">
        <p>FileBuddy - Smart File Analyzer © 2025</p>
      </footer>
    </div>
  );
}

function VisualizationPanel({ analysis, onVisualize, loading, visualization }) {
  const [chartType, setChartType] = useState('histogram');
  const [xColumn, setXColumn] = useState('');
  const [yColumn, setYColumn] = useState('');

  const numericColumns = Object.entries(analysis.column_info)
    .filter(([_, info]) => info.dtype.includes('int') || info.dtype.includes('float'))
    .map(([col]) => col);

  const allColumns = Object.keys(analysis.column_info);

  const handleGenerate = () => {
    if (chartType === 'correlation' || chartType === 'box') {
      onVisualize(chartType, null, null, numericColumns);
    } else if (chartType === 'scatter' || chartType === 'line') {
      if (xColumn && yColumn) {
        onVisualize(chartType, xColumn, yColumn);
      }
    } else {
      if (xColumn) {
        onVisualize(chartType, xColumn);
      }
    }
  };

  return (
    <div className="visualization-panel">
      <div className="viz-controls">
        <div className="control-group">
          <label>Chart Type</label>
          <Select value={chartType} onValueChange={setChartType}>
            <SelectTrigger data-testid="chart-type-select">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="histogram">Histogram</SelectItem>
              <SelectItem value="scatter">Scatter Plot</SelectItem>
              <SelectItem value="bar">Bar Chart</SelectItem>
              <SelectItem value="box">Box Plot</SelectItem>
              <SelectItem value="correlation">Correlation Heatmap</SelectItem>
              <SelectItem value="line">Line Chart</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {(chartType === 'histogram' || chartType === 'bar') && (
          <div className="control-group">
            <label>Column</label>
            <Select value={xColumn} onValueChange={setXColumn}>
              <SelectTrigger data-testid="x-column-select">
                <SelectValue placeholder="Select column" />
              </SelectTrigger>
              <SelectContent>
                {allColumns.map(col => (
                  <SelectItem key={col} value={col}>{col}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        )}

        {(chartType === 'scatter' || chartType === 'line') && (
          <>
            <div className="control-group">
              <label>X-Axis</label>
              <Select value={xColumn} onValueChange={setXColumn}>
                <SelectTrigger data-testid="x-axis-select">
                  <SelectValue placeholder="Select column" />
                </SelectTrigger>
                <SelectContent>
                  {numericColumns.map(col => (
                    <SelectItem key={col} value={col}>{col}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="control-group">
              <label>Y-Axis</label>
              <Select value={yColumn} onValueChange={setYColumn}>
                <SelectTrigger data-testid="y-axis-select">
                  <SelectValue placeholder="Select column" />
                </SelectTrigger>
                <SelectContent>
                  {numericColumns.map(col => (
                    <SelectItem key={col} value={col}>{col}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </>
        )}

        <Button
          data-testid="generate-chart-btn"
          onClick={handleGenerate}
          disabled={loading}
          className="generate-btn"
        >
          <BarChart3 size={20} className="mr-2" />
          Generate Chart
        </Button>
      </div>

      {visualization && (
        <div className="visualization-display">
          <img src={visualization} alt="Data Visualization" className="viz-image" data-testid="visualization-image" />
        </div>
      )}
    </div>
  );
}

export default FileAnalyzer;