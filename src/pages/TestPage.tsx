import React from 'react';

const TestPage: React.FC = () => {
  return (
    <div style={{ 
      padding: '20px', 
      fontFamily: 'Arial, sans-serif',
      backgroundColor: '#f5f5f5',
      minHeight: '100vh'
    }}>
      <h1 style={{ color: '#333' }}>WHASA Test Page</h1>
      <p>This is a test page to verify React is working properly.</p>
      
      <div style={{ 
        backgroundColor: 'white', 
        padding: '20px', 
        borderRadius: '8px',
        margin: '20px 0',
        boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
      }}>
        <h2>Status Check:</h2>
        <ul>
          <li>✅ React is rendering</li>
          <li>✅ Development server is running</li>
          <li>✅ Routing is working</li>
          <li>✅ Components are loading</li>
        </ul>
      </div>
      
      <div style={{ 
        backgroundColor: '#e3f2fd', 
        padding: '15px', 
        borderRadius: '8px',
        border: '1px solid #2196f3'
      }}>
        <h3>Next Steps:</h3>
        <p>1. Set up Supabase authentication</p>
        <p>2. Configure environment variables</p>
        <p>3. Test login functionality</p>
        <p>4. Access protected routes</p>
      </div>
      
      <button 
        onClick={() => alert('React is working!')}
        style={{
          backgroundColor: '#4caf50',
          color: 'white',
          border: 'none',
          padding: '10px 20px',
          borderRadius: '4px',
          cursor: 'pointer',
          fontSize: '16px'
        }}
      >
        Test React Functionality
      </button>
    </div>
  );
};

export default TestPage; 