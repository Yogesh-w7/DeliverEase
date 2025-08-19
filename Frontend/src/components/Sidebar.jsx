import React from 'react';
import '../styles/Sidebar.css'; // Make sure to create and import this CSS

const Sidebar = ({ switchTab }) => {
    return (
        <div className="sidebar">
            <div className="sidebar-header">
                <div className="logo-circle">
                    <i className="fas fa-truck icon-blue"></i>
                </div>
                <h1 className="sidebar-title">Delivery Hub</h1>
                <p className="sidebar-subtitle"></p>
            </div>

            <div className="sidebar-buttons">
                <button
                    onClick={() => switchTab('dashboard')}
                    className="sidebar-button"
                >
                    <i className="fas fa-chart-line icon"></i>
                    <span className="button-text">Dashboard</span>
                </button>

                <button
                    onClick={() => switchTab('map-view')}
                    className="sidebar-button active"
                >
                    <i className="fas fa-map-marked-alt icon"></i>
                    <span className="button-text">Live Map</span>
                </button>

            </div>

          
        </div>
    );
};

export default Sidebar;
