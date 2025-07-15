/**
 * Data Utility Functions
 *
 * This file contains utility functions for data compression/decompression
 * to optimize localStorage usage and improve performance.
 */

// Simple compression utility using base64 encoding
const dataUtils = {
    /**
     * Compress data using base64 encoding
     * @param {string} data - The data to compress
     * @returns {string} - Compressed data
     */
    compress: function(data) {
        try {
            if (typeof data === 'object') {
                data = JSON.stringify(data);
            }
            return btoa(unescape(encodeURIComponent(data)));
        } catch (error) {
            console.error('Compression error:', error);
            return data;
        }
    },

    /**
     * Decompress data from base64 encoding
     * @param {string} data - The compressed data
     * @returns {string} - Decompressed data
     */
    decompress: function(data) {
        try {
            data = decodeURIComponent(escape(atob(data)));
            try {
                return JSON.parse(data);
            } catch (parseError) {
                return data;
            }
        } catch (error) {
            console.error('Decompression error:', error);
            return data;
        }
    },

    /**
     * Optimized localStorage utility
     * @type {Object}
     */
    optimizedStorage: {
        /**
         * Set item with compression
         * @param {string} key - The key to store
         * @param {*} value - The value to store (will be stringified and compressed)
         */
        setItem: function(key, value) {
            try {
                let stringValue = typeof value === 'string' ? value : JSON.stringify(value);
                stringValue = dataUtils.compress(stringValue);
                localStorage.setItem(key, stringValue);
            } catch (error) {
                console.error('Error setting item in optimizedStorage:', error);
            }
        },

        /**
         * Get item with decompression
         * @param {string} key - The key to retrieve
         * @returns {*} - The parsed value or null if error occurs
         */
        getItem: function(key) {
            try {
                let stringValue = localStorage.getItem(key);
                if (!stringValue) return null;
                return dataUtils.decompress(stringValue);
            } catch (error) {
                console.error('Error getting item from optimizedStorage:', error);
                return null;
            }
        },

        /**
         * Remove item from storage
         * @param {string} key - The key to remove
         */
        removeItem: function(key) {
            try {
                localStorage.removeItem(key);
            } catch (error) {
                console.error('Error removing item from optimizedStorage:', error);
            }
        },

        /**
         * Clear all items from storage
         */
        clear: function() {
            try {
                localStorage.clear();
            } catch (error) {
                console.error('Error clearing optimizedStorage:', error);
            }
        }
    }
};

export { dataUtils };