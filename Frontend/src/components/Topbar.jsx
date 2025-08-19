import React from "react";
import "../styles/Topbar.css"; // Make sure to create this CSS file

const TopBar = () => {
    return (
        <div className="topbar">
            <div className="topbar-left">
                <h1 className="topbar-title"> Deliery Hub</h1>
                <p className="topbar-subtitle"></p>
            </div>
            <div className="topbar-right">
                <div className="icon-button-wrapper">
                    <button className="icon-button">
                        <i className="fas fa-bell icon"></i>
                        <span className="notification-badge">5</span>
                    </button>
                </div>
                <div className="icon-button-wrapper">
                    <button className="icon-button">
                        <i className="fas fa-envelope icon"></i>
                        <span className="notification-badge">2</span>
                    </button>
                </div>
                <div className="user-info">
                    <div className="user-avatar">
                        <i className="fas fa-user user-icon"></i>
                    </div>
                    <div className="user-details">
                        <p className="user-name">Logistics Manager</p>
                        <p className="user-email">admin@walmart.com</p>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default TopBar;
