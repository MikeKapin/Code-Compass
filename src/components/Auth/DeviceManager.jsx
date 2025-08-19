// Device management component
import React, { useState, useEffect } from 'react';
import './DeviceManager.css';

const DeviceManager = ({ user, isOpen, onClose }) => {
  const [devices, setDevices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [removing, setRemoving] = useState(null);
  const [error, setError] = useState('');
  const [currentDeviceToken, setCurrentDeviceToken] = useState('');

  useEffect(() => {
    if (isOpen && user) {
      loadDevices();
      setCurrentDeviceToken(localStorage.getItem('codecompass_device_token') || '');
    }
  }, [isOpen, user]);

  const loadDevices = async () => {
    try {
      setLoading(true);
      const { vercelAuth } = await import('../../services/vercelAuth.js');
      const userDevices = await vercelAuth.getUserDevices();
      setDevices(userDevices);
    } catch (error) {
      console.error('Failed to load devices:', error);
      setError('Failed to load devices');
    } finally {
      setLoading(false);
    }
  };

  const handleRemoveDevice = async (deviceId, deviceName) => {
    if (!window.confirm(`Remove "${deviceName}" from your account?`)) {
      return;
    }

    try {
      setRemoving(deviceId);
      const { vercelAuth } = await import('../../services/vercelAuth.js');
      const result = await vercelAuth.removeDevice(deviceId);
      
      if (result.success) {
        // Reload devices
        await loadDevices();
        
        // If user removed current device, they'll need to re-authenticate
        if (result.wasCurrentDevice) {
          alert('You removed this device. You will be signed out.');
          onClose();
          window.location.reload();
        }
      } else {
        setError(result.message);
      }
    } catch (error) {
      console.error('Failed to remove device:', error);
      setError('Failed to remove device');
    } finally {
      setRemoving(null);
    }
  };

  const formatDate = (dateString) => {
    try {
      const date = new Date(dateString);
      return date.toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      });
    } catch (error) {
      return 'Unknown';
    }
  };

  const getDeviceIcon = (deviceName) => {
    const name = deviceName.toLowerCase();
    if (name.includes('mobile')) return '📱';
    if (name.includes('tablet')) return '💻';
    if (name.includes('mac')) return '🖥️';
    if (name.includes('windows')) return '🖥️';
    if (name.includes('linux')) return '🖥️';
    return '💻';
  };

  if (!isOpen) return null;

  return (
    <div className="device-modal-overlay" onClick={onClose}>
      <div className="device-modal" onClick={e => e.stopPropagation()}>
        <button className="device-modal-close" onClick={onClose}>×</button>
        
        <div className="device-modal-header">
          <h2>Manage Your Devices</h2>
          <p className="device-modal-subtitle">
            You can use Code Compass on up to 3 devices. Remove devices you no longer use.
          </p>
        </div>

        <div className="device-modal-content">
          {loading ? (
            <div className="device-loading">
              <div className="loading-spinner">⏳</div>
              <p>Loading your devices...</p>
            </div>
          ) : error ? (
            <div className="device-error">
              <p>{error}</p>
              <button onClick={loadDevices} className="retry-btn">
                Try Again
              </button>
            </div>
          ) : devices.length === 0 ? (
            <div className="no-devices">
              <p>No devices registered</p>
            </div>
          ) : (
            <>
              <div className="device-count">
                <span className="count-badge">
                  {devices.length} of 3 devices used
                </span>
              </div>

              <div className="device-list">
                {devices.map((device) => (
                  <div 
                    key={device.id} 
                    className={`device-item ${device.id === currentDeviceToken ? 'current-device' : ''}`}
                  >
                    <div className="device-info">
                      <div className="device-icon">
                        {getDeviceIcon(device.name)}
                      </div>
                      <div className="device-details">
                        <h3 className="device-name">
                          {device.name}
                          {device.id === currentDeviceToken && (
                            <span className="current-label">Current Device</span>
                          )}
                        </h3>
                        <div className="device-meta">
                          <span className="device-browser">{device.browser} • {device.os}</span>
                          <span className="device-date">
                            Last active: {formatDate(device.lastActiveAt)}
                          </span>
                          <span className="device-registered">
                            Registered: {formatDate(device.registeredAt)}
                          </span>
                        </div>
                      </div>
                    </div>
                    
                    <div className="device-actions">
                      <button
                        onClick={() => handleRemoveDevice(device.id, device.name)}
                        className="remove-device-btn"
                        disabled={removing === device.id}
                        title="Remove this device"
                      >
                        {removing === device.id ? (
                          <span className="loading-spinner-small">⏳</span>
                        ) : (
                          '🗑️'
                        )}
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </>
          )}
        </div>

        <div className="device-modal-footer">
          <div className="device-help">
            <p>
              <strong>Need help?</strong> Contact support at{' '}
              <a href="mailto:support@codecompass.com">support@codecompass.com</a>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DeviceManager;