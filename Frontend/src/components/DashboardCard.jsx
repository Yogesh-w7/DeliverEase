import React from "react";
import "../styles/DashboardCard.css";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faFire, faCar, faLocationDot } from "@fortawesome/free-solid-svg-icons";


const DashboardCard = ({ title, value, icon, progress, subText, color }) => {
  return (
    <div className="dashboard-card">
      <div className="dashboard-card-header">
        <div>
          <h3 className="dashboard-card-title">{title}</h3>
          <p className="dashboard-card-value">{value}</p>
        </div>
        <div className={`icon-circle bg-${color}-100 text-${color}-600`}>
          <i className={`fas ${icon} dashboard-card-icon`}></i>
        </div>
      </div>

      {progress && (
        <div className="dashboard-card-progress-section">
          <div className="progress-container">
            <div className="progress-bar" style={{ width: `${progress}%` }}></div>
          </div>
          <div className="progress-subtext">
            <span>{subText[0]}</span>
            <span>{subText[1]}</span>
          </div>
        </div>
      )}

      {title === "Customer Rating" && (
        <div className="customer-rating-section">
          <div className="star-rating">
            <i className="fas fa-star"></i>
            <i className="fas fa-star"></i>
            <i className="fas fa-star"></i>
            <i className="fas fa-star"></i>
            <i className="fas fa-star-half-alt"></i>
          </div>
          <p className="rating-text">Based on 320 reviews</p>
        </div>
      )}
    </div>
  );
};

export default DashboardCard;
