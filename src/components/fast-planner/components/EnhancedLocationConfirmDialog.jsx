/**
 * Enhanced Location Confirm Dialog
 * 
 * Shows fuzzy search results when exact matches are not found
 * Allows user to confirm location selection or cancel
 */

import React from 'react';

const EnhancedLocationConfirmDialog = ({ 
  isOpen, 
  searchTerm, 
  fuzzyResults, 
  onConfirm, 
  onCancel 
}) => {
  if (!isOpen || !fuzzyResults || fuzzyResults.length === 0) {
    return null;
  }

  const handleResultClick = (result) => {
    onConfirm(result.platform);
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-lg max-w-md w-full mx-4">
        <div className="p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">
            Location Not Found
          </h3>
          
          <p className="text-gray-600 mb-4">
            No exact match found for "<strong>{searchTerm}</strong>".
          </p>
          
          <p className="text-gray-600 mb-4">
            Did you mean one of these locations?
          </p>
          
          <div className="space-y-2 mb-6 max-h-60 overflow-y-auto">
            {fuzzyResults.map((result, index) => (
              <button
                key={index}
                onClick={() => handleResultClick(result)}
                className="w-full text-left p-3 rounded-lg border border-gray-200 hover:bg-blue-50 hover:border-blue-300 transition-colors"
              >
                <div className="font-medium text-gray-900">
                  {result.platform.name}
                </div>
                <div className="text-sm text-gray-500">
                  Found in: {result.matchLabel || result.matchField}
                  {result.matchValue && result.matchValue !== result.platform.name && (
                    <span className="ml-2 text-gray-400">
                      "{result.matchValue}"
                    </span>
                  )}
                </div>
                <div className="text-xs text-gray-400">
                  Match: {Math.round(result.score * 100)}%
                </div>
              </button>
            ))}
          </div>
          
          <div className="flex space-x-3">
            <button
              onClick={onCancel}
              className="flex-1 px-4 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={onCancel}
              className="flex-1 px-4 py-2 text-white bg-red-600 rounded-lg hover:bg-red-700 transition-colors"
            >
              None of these
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default EnhancedLocationConfirmDialog;