/**
 * notifications.js
 * 
 * A clean notification system for showing important messages
 * without conflicting with other UI elements.
 */

/**
 * Notification types
 */
const NotificationType = {
  INFO: 'info',
  SUCCESS: 'success',
  WARNING: 'warning',
  ERROR: 'error'
};

/**
 * Creates and shows a notification
 * @param {string} message - The message to display
 * @param {string} type - The notification type (info, success, warning, error)
 * @param {number} duration - How long to show the notification in ms
 * @returns {HTMLElement} - The notification element
 */
function showNotification(message, type = NotificationType.INFO, duration = 5000) {
  // Check if the notification container exists, create it if not
  let container = document.getElementById('clean-notifications-container');
  if (!container) {
    container = document.createElement('div');
    container.id = 'clean-notifications-container';
    container.style.position = 'fixed';
    container.style.top = '20px';
    container.style.right = '20px';
    container.style.zIndex = '9999';
    container.style.display = 'flex';
    container.style.flexDirection = 'column';
    container.style.alignItems = 'flex-end';
    container.style.gap = '10px';
    document.body.appendChild(container);
  }
  
  // Create the notification element
  const notification = document.createElement('div');
  notification.className = `clean-notification clean-notification-${type}`;
  notification.style.backgroundColor = getBackgroundColor(type);
  notification.style.color = '#fff';
  notification.style.padding = '12px 16px';
  notification.style.borderRadius = '6px';
  notification.style.boxShadow = '0 2px 10px rgba(0, 0, 0, 0.15)';
  notification.style.marginBottom = '10px';
  notification.style.maxWidth = '300px';
  notification.style.position = 'relative';
  notification.style.animation = 'cleanNotificationSlideIn 0.3s ease-out forwards';
  notification.style.opacity = '0';
  notification.style.transform = 'translateX(100%)';
  
  // Add an icon based on the type
  const icon = document.createElement('span');
  icon.className = 'clean-notification-icon';
  icon.textContent = getIcon(type);
  icon.style.marginRight = '8px';
  notification.appendChild(icon);
  
  // Add the message
  const messageElement = document.createElement('span');
  messageElement.textContent = message;
  notification.appendChild(messageElement);
  
  // Add a close button
  const closeButton = document.createElement('span');
  closeButton.className = 'clean-notification-close';
  closeButton.textContent = '×';
  closeButton.style.position = 'absolute';
  closeButton.style.top = '5px';
  closeButton.style.right = '10px';
  closeButton.style.cursor = 'pointer';
  closeButton.style.fontSize = '18px';
  closeButton.style.fontWeight = 'bold';
  closeButton.onclick = () => removeNotification(notification);
  notification.appendChild(closeButton);
  
  // Add the notification to the container
  container.appendChild(notification);
  
  // Add the animation style if it doesn't exist
  if (!document.getElementById('clean-notification-style')) {
    const style = document.createElement('style');
    style.id = 'clean-notification-style';
    style.textContent = `
      @keyframes cleanNotificationSlideIn {
        from {
          opacity: 0;
          transform: translateX(100%);
        }
        to {
          opacity: 1;
          transform: translateX(0);
        }
      }
      
      @keyframes cleanNotificationSlideOut {
        from {
          opacity: 1;
          transform: translateX(0);
        }
        to {
          opacity: 0;
          transform: translateX(100%);
        }
      }
    `;
    document.head.appendChild(style);
  }
  
  // Force a reflow to trigger the animation
  notification.offsetHeight;
  notification.style.opacity = '1';
  notification.style.transform = 'translateX(0)';
  
  // Automatically remove the notification after the duration
  if (duration > 0) {
    setTimeout(() => {
      removeNotification(notification);
    }, duration);
  }
  
  return notification;
}

/**
 * Removes a notification with animation
 * @param {HTMLElement} notification - The notification element to remove
 */
function removeNotification(notification) {
  // Animate out
  notification.style.animation = 'cleanNotificationSlideOut 0.3s ease-in forwards';
  
  // Remove after animation completes
  setTimeout(() => {
    if (notification.parentNode) {
      notification.parentNode.removeChild(notification);
    }
    
    // Check if container is empty, remove it if so
    const container = document.getElementById('clean-notifications-container');
    if (container && container.childNodes.length === 0) {
      document.body.removeChild(container);
    }
  }, 300);
}

/**
 * Gets the background color for a notification type
 * @param {string} type - The notification type
 * @returns {string} - The background color
 */
function getBackgroundColor(type) {
  switch (type) {
    case NotificationType.SUCCESS:
      return '#28a745';
    case NotificationType.WARNING:
      return '#ffc107';
    case NotificationType.ERROR:
      return '#dc3545';
    case NotificationType.INFO:
    default:
      return '#17a2b8';
  }
}

/**
 * Gets the icon for a notification type
 * @param {string} type - The notification type
 * @returns {string} - The icon character
 */
function getIcon(type) {
  switch (type) {
    case NotificationType.SUCCESS:
      return '✅';
    case NotificationType.WARNING:
      return '⚠️';
    case NotificationType.ERROR:
      return '❌';
    case NotificationType.INFO:
    default:
      return 'ℹ️';
  }
}

/**
 * Shorthand functions for each notification type
 */
function showInfo(message, duration = 5000) {
  return showNotification(message, NotificationType.INFO, duration);
}

function showSuccess(message, duration = 5000) {
  return showNotification(message, NotificationType.SUCCESS, duration);
}

function showWarning(message, duration = 5000) {
  return showNotification(message, NotificationType.WARNING, duration);
}

function showError(message, duration = 5000) {
  return showNotification(message, NotificationType.ERROR, duration);
}

// Detect when the page is loaded and show a startup notification
window.addEventListener('load', () => {
  // Check if we're using the clean implementation
  if (window.interactionController) {
    setTimeout(() => {
      showSuccess('Clean implementation active - Enjoy a smoother experience!', 8000);
    }, 2000);
  }
});

// Make notifications globally available
window.cleanNotifications = {
  show: showNotification,
  info: showInfo,
  success: showSuccess,
  warning: showWarning,
  error: showError,
  remove: removeNotification,
  types: NotificationType
};

export {
  showNotification,
  showInfo,
  showSuccess,
  showWarning,
  showError,
  removeNotification,
  NotificationType
};