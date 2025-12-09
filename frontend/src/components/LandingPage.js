import { useNavigate } from 'react-router-dom';
import { FileText, Upload, BarChart3, Download, ArrowRight, CheckCircle, Sparkles, Database, TrendingUp } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import axios from 'axios';
import { toast } from 'sonner';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

function LandingPage() {
  const navigate = useNavigate();

  const handleDownloadSample = async (sampleType) => {
    try {
      const response = await axios.get(`${API}/sample-dataset/${sampleType}`, {
        responseType: 'blob'
      });
      
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `sample_${sampleType}.csv`);
      document.body.appendChild(link);
      link.click();
      link.remove();
      toast.success(`Sample ${sampleType} dataset downloaded!`);
    } catch (error) {
      console.error('Error downloading sample:', error);
      toast.error('Error downloading sample dataset');
    }
  };

  return (
    <div className="landing-page">
      {/* Header */}
      <header className="landing-header">
        <div className="landing-header-content">
          <div className="landing-logo">
            <FileText className="landing-logo-icon" size={32} />
            <h1 className="landing-logo-text">FileBuddy</h1>
          </div>
          <Button 
            data-testid="nav-analyzer-btn" 
            onClick={() => navigate('/analyzer')} 
            variant="outline" 
            className="nav-btn"
          >
            Open Analyzer
            <ArrowRight size={16} className="ml-2" />
          </Button>
        </div>
      </header>

      {/* Hero Section */}
      <section className="hero-section">
        <div className="hero-content">
          <div className="hero-badge">
            <Sparkles size={16} />
            <span>Smart Data Analysis Made Simple</span>
          </div>
          <h1 className="hero-title">
            Analyze, Clean & Visualize
            <br />
            <span className="hero-title-gradient">Your Data Files</span>
          </h1>
          <p className="hero-description">
            FileBuddy is your intelligent companion for understanding datasets.
            Upload CSV, JSON, or Excel files and get instant insights with powerful
            analysis, cleaning, and visualization tools.
          </p>
          <div className="hero-actions">
            <Button 
              data-testid="hero-get-started-btn" 
              onClick={() => navigate('/analyzer')} 
              size="lg" 
              className="hero-btn-primary"
            >
              <Upload size={20} className="mr-2" />
              Get Started Free
            </Button>
            <Button 
              data-testid="hero-download-sample-btn" 
              onClick={() => handleDownloadSample('sales')} 
              size="lg" 
              variant="outline" 
              className="hero-btn-secondary"
            >
              <Download size={20} className="mr-2" />
              Download Sample
            </Button>
          </div>
        </div>
        <div className="hero-visual">
          <div className="hero-card-1">
            <div className="hero-card-icon">
              <Database size={32} />
            </div>
            <div className="hero-card-text">
              <h3>1.2K+ Files</h3>
              <p>Analyzed Today</p>
            </div>
          </div>
          <div className="hero-card-2">
            <div className="hero-card-icon">
              <TrendingUp size={32} />
            </div>
            <div className="hero-card-text">
              <h3>99.9% Accurate</h3>
              <p>Data Processing</p>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="features-section">
        <div className="features-header">
          <h2 className="features-title">Powerful Features for Data Analysis</h2>
          <p className="features-subtitle">
            Everything you need to understand and process your datasets efficiently
          </p>
        </div>

        <div className="features-grid">
          <Card className="feature-card" data-testid="feature-upload">
            <CardHeader>
              <div className="feature-icon">
                <Upload size={28} />
              </div>
              <CardTitle>Easy File Upload</CardTitle>
              <CardDescription>
                Drag & drop or browse CSV, JSON, and Excel files. Instant upload with
                automatic format detection.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ul className="feature-list">
                <li><CheckCircle size={16} /> Support for CSV, JSON, Excel</li>
                <li><CheckCircle size={16} /> Drag and drop interface</li>
                <li><CheckCircle size={16} /> Fast processing</li>
              </ul>
            </CardContent>
          </Card>

          <Card className="feature-card" data-testid="feature-analysis">
            <CardHeader>
              <div className="feature-icon">
                <FileText size={28} />
              </div>
              <CardTitle>Comprehensive Analysis</CardTitle>
              <CardDescription>
                Get detailed insights including data types, null values, statistical
                summaries, and column information.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ul className="feature-list">
                <li><CheckCircle size={16} /> Data type detection</li>
                <li><CheckCircle size={16} /> Null value identification</li>
                <li><CheckCircle size={16} /> Statistical summaries</li>
              </ul>
            </CardContent>
          </Card>

          <Card className="feature-card" data-testid="feature-cleaning">
            <CardHeader>
              <div className="feature-icon">
                <Sparkles size={28} />
              </div>
              <CardTitle>Smart Data Cleaning</CardTitle>
              <CardDescription>
                Handle missing values with multiple methods including mean, median,
                mode, or drop rows entirely.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ul className="feature-list">
                <li><CheckCircle size={16} /> 6 cleaning methods</li>
                <li><CheckCircle size={16} /> Statistical filling</li>
                <li><CheckCircle size={16} /> Forward/backward fill</li>
              </ul>
            </CardContent>
          </Card>

          <Card className="feature-card" data-testid="feature-visualization">
            <CardHeader>
              <div className="feature-icon">
                <BarChart3 size={28} />
              </div>
              <CardTitle>Rich Visualizations</CardTitle>
              <CardDescription>
                Create stunning charts including histograms, scatter plots, heatmaps,
                and more to visualize your data.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ul className="feature-list">
                <li><CheckCircle size={16} /> 6 chart types</li>
                <li><CheckCircle size={16} /> Interactive selection</li>
                <li><CheckCircle size={16} /> High-quality output</li>
              </ul>
            </CardContent>
          </Card>

          <Card className="feature-card" data-testid="feature-conversion">
            <CardHeader>
              <div className="feature-icon">
                <Database size={28} />
              </div>
              <CardTitle>Format Conversion</CardTitle>
              <CardDescription>
                Convert between CSV, JSON, and Excel formats seamlessly. Export your
                cleaned data in any format.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ul className="feature-list">
                <li><CheckCircle size={16} /> Multi-format support</li>
                <li><CheckCircle size={16} /> Preserve data integrity</li>
                <li><CheckCircle size={16} /> One-click conversion</li>
              </ul>
            </CardContent>
          </Card>

          <Card className="feature-card" data-testid="feature-download">
            <CardHeader>
              <div className="feature-icon">
                <Download size={28} />
              </div>
              <CardTitle>Quick Export</CardTitle>
              <CardDescription>
                Download your processed datasets instantly. Get your cleaned and
                analyzed data ready for use.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ul className="feature-list">
                <li><CheckCircle size={16} /> Instant download</li>
                <li><CheckCircle size={16} /> Multiple formats</li>
                <li><CheckCircle size={16} /> Preserved formatting</li>
              </ul>
            </CardContent>
          </Card>
        </div>
      </section>

      {/* Sample Datasets Section */}
      <section className="samples-section">
        <div className="samples-header">
          <h2 className="samples-title">Try with Sample Datasets</h2>
          <p className="samples-subtitle">
            Download our curated sample datasets to test FileBuddy's capabilities
          </p>
        </div>

        <div className="samples-grid">
          <Card className="sample-card">
            <CardHeader>
              <CardTitle>Sales Dataset</CardTitle>
              <CardDescription>
                Sample sales data with 500 rows including dates, products, quantities,
                and revenues. Contains some null values for testing.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="sample-meta">
                <span className="sample-tag">500 rows</span>
                <span className="sample-tag">7 columns</span>
                <span className="sample-tag">CSV</span>
              </div>
              <Button
                data-testid="download-sales-btn"
                onClick={() => handleDownloadSample('sales')}
                className="sample-download-btn"
                variant="outline"
              >
                <Download size={18} className="mr-2" />
                Download Sales Data
              </Button>
            </CardContent>
          </Card>

          <Card className="sample-card">
            <CardHeader>
              <CardTitle>Customer Dataset</CardTitle>
              <CardDescription>
                Customer information with demographics, purchase history, and
                satisfaction scores. Perfect for analysis practice.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="sample-meta">
                <span className="sample-tag">300 rows</span>
                <span className="sample-tag">6 columns</span>
                <span className="sample-tag">CSV</span>
              </div>
              <Button
                data-testid="download-customer-btn"
                onClick={() => handleDownloadSample('customer')}
                className="sample-download-btn"
                variant="outline"
              >
                <Download size={18} className="mr-2" />
                Download Customer Data
              </Button>
            </CardContent>
          </Card>

          <Card className="sample-card">
            <CardHeader>
              <CardTitle>Employee Dataset</CardTitle>
              <CardDescription>
                Employee records with salaries, departments, performance metrics, and
                tenure information for HR analysis.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="sample-meta">
                <span className="sample-tag">250 rows</span>
                <span className="sample-tag">8 columns</span>
                <span className="sample-tag">CSV</span>
              </div>
              <Button
                data-testid="download-employee-btn"
                onClick={() => handleDownloadSample('employee')}
                className="sample-download-btn"
                variant="outline"
              >
                <Download size={18} className="mr-2" />
                Download Employee Data
              </Button>
            </CardContent>
          </Card>
        </div>
      </section>

      {/* CTA Section */}
      <section className="cta-section">
        <div className="cta-content">
          <h2 className="cta-title">Ready to Analyze Your Data?</h2>
          <p className="cta-description">
            Start exploring your datasets with FileBuddy's powerful analysis tools.
            No signup required, completely free.
          </p>
          <Button
            data-testid="cta-get-started-btn"
            onClick={() => navigate('/analyzer')}
            size="lg"
            className="cta-btn"
          >
            <Upload size={20} className="mr-2" />
            Start Analyzing Now
          </Button>
        </div>
      </section>

      {/* Footer */}
      <footer className="landing-footer">
        <div className="footer-content">
          <div className="footer-brand">
            <FileText size={24} />
            <span className="footer-brand-text">FileBuddy</span>
          </div>
          <p className="footer-text">Smart File Analyzer © 2025</p>
        </div>
      </footer>
    </div>
  );
}

export default LandingPage;