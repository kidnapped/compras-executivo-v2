/**
 * Cookie Management Utilities
 * Provides CRUD operations for browser cookies with validation and error handling
 */

export default {
  // Configuration
  defaultExpireDays: 30,
  defaultPath: '/',
  defaultSameSite: 'Lax',
  
  // Validation regex patterns
  patterns: {
    cookieName: /^[a-zA-Z0-9_-]+$/,
    cookieValue: /^[^;,\n\r\t]*$/
  },

  /**
   * Auto-initialization method (following the pattern of other app modules)
   */
  cookieAutoInit() {
    console.log('🔧 Cookie.cookieAutoInit() chamado');
    
    // Verificar se cookies estão habilitados
    if (!this.cookieAreCookiesEnabled()) {
      console.warn('⚠️ Cookies não estão habilitados no navegador');
      return false;
    }
    
    console.log('✅ Cookie manager initialized successfully');
    return true;
  },

  /**
   * Create/Update a cookie
   * @param {string} name - Cookie name
   * @param {string} value - Cookie value
   * @param {Object} options - Cookie options
   * @returns {boolean} Success status
   */
  cookieSet(name, value, options = {}) {
    try {
      // Validate input
      if (!this.cookieValidateName(name)) {
        console.error('❌ Cookie name invalid:', name);
        return false;
      }
      
      if (!this.cookieValidateValue(value)) {
        console.error('❌ Cookie value invalid:', value);
        return false;
      }

      // Build cookie string
      const cookieOptions = {
        expires: options.expires || this.defaultExpireDays,
        path: options.path || this.defaultPath,
        domain: options.domain || '',
        secure: options.secure || false,
        sameSite: options.sameSite || this.defaultSameSite,
        httpOnly: false // Cannot be set via JavaScript
      };

      let cookieString = `${encodeURIComponent(name)}=${encodeURIComponent(value)}`;

      // Add expiration
      if (cookieOptions.expires) {
        const expirationDate = new Date();
        if (typeof cookieOptions.expires === 'number') {
          expirationDate.setTime(expirationDate.getTime() + (cookieOptions.expires * 24 * 60 * 60 * 1000));
        } else {
          expirationDate.setTime(cookieOptions.expires);
        }
        cookieString += `; expires=${expirationDate.toUTCString()}`;
      }

      // Add path
      if (cookieOptions.path) {
        cookieString += `; path=${cookieOptions.path}`;
      }

      // Add domain
      if (cookieOptions.domain) {
        cookieString += `; domain=${cookieOptions.domain}`;
      }

      // Add secure flag
      if (cookieOptions.secure) {
        cookieString += `; secure`;
      }

      // Add SameSite
      if (cookieOptions.sameSite) {
        cookieString += `; samesite=${cookieOptions.sameSite}`;
      }

      // Set the cookie
      document.cookie = cookieString;
      
      console.log(`✅ Cookie '${name}' set successfully`);
      return true;

    } catch (error) {
      console.error('❌ Error setting cookie:', error);
      return false;
    }
  },

  /**
   * Read a cookie value
   * @param {string} name - Cookie name
   * @returns {string|null} Cookie value or null if not found
   */
  cookieGet(name) {
    try {
      if (!this.cookieValidateName(name)) {
        console.error('❌ Cookie name invalid:', name);
        return null;
      }

      const nameEQ = encodeURIComponent(name) + '=';
      const cookies = document.cookie.split(';');

      for (let i = 0; i < cookies.length; i++) {
        let cookie = cookies[i].trim();
        
        if (cookie.indexOf(nameEQ) === 0) {
          const value = cookie.substring(nameEQ.length);
          return decodeURIComponent(value);
        }
      }

      return null;

    } catch (error) {
      console.error('❌ Error getting cookie:', error);
      return null;
    }
  },

  /**
   * Delete a cookie
   * @param {string} name - Cookie name
   * @param {Object} options - Cookie options (path, domain)
   * @returns {boolean} Success status
   */
  cookieRemove(name, options = {}) {
    try {
      if (!this.cookieValidateName(name)) {
        console.error('❌ Cookie name invalid:', name);
        return false;
      }

      // Set cookie with past expiration date
      const deleteOptions = {
        ...options,
        expires: new Date(0).getTime()
      };

      const result = this.cookieSet(name, '', deleteOptions);
      
      if (result) {
        console.log(`✅ Cookie '${name}' removed successfully`);
      }
      
      return result;

    } catch (error) {
      console.error('❌ Error removing cookie:', error);
      return false;
    }
  },

  /**
   * Check if a cookie exists
   * @param {string} name - Cookie name
   * @returns {boolean} Existence status
   */
  cookieExists(name) {
    return this.cookieGet(name) !== null;
  },

  /**
   * Get all cookies as an object
   * @returns {Object} All cookies as key-value pairs
   */
  cookieGetAll() {
    try {
      const cookies = {};
      const cookieArray = document.cookie.split(';');

      for (let i = 0; i < cookieArray.length; i++) {
        const cookie = cookieArray[i].trim();
        
        if (cookie) {
          const [name, ...valueParts] = cookie.split('=');
          const value = valueParts.join('=');
          
          if (name && value !== undefined) {
            cookies[decodeURIComponent(name)] = decodeURIComponent(value);
          }
        }
      }

      return cookies;

    } catch (error) {
      console.error('❌ Error getting all cookies:', error);
      return {};
    }
  },

  /**
   * Clear all cookies (domain-specific)
   * @param {Object} options - Options for clearing (path, domain)
   * @returns {boolean} Success status
   */
  cookieClearAll(options = {}) {
    try {
      const cookies = this.cookieGetAll();
      let success = true;

      for (const name in cookies) {
        if (cookies.hasOwnProperty(name)) {
          const result = this.cookieRemove(name, options);
          if (!result) {
            success = false;
          }
        }
      }

      if (success) {
        console.log('✅ All cookies cleared successfully');
      } else {
        console.warn('⚠️ Some cookies could not be cleared');
      }

      return success;

    } catch (error) {
      console.error('❌ Error clearing all cookies:', error);
      return false;
    }
  },

  /**
   * Get cookie with JSON parsing
   * @param {string} name - Cookie name
   * @returns {*} Parsed JSON value or null
   */
  cookieGetJSON(name) {
    try {
      const value = this.cookieGet(name);
      
      if (value === null) {
        return null;
      }

      return JSON.parse(value);

    } catch (error) {
      console.error('❌ Error parsing JSON cookie:', error);
      return null;
    }
  },

  /**
   * Set cookie with JSON stringification
   * @param {string} name - Cookie name
   * @param {*} value - Value to stringify
   * @param {Object} options - Cookie options
   * @returns {boolean} Success status
   */
  cookieSetJSON(name, value, options = {}) {
    try {
      const jsonString = JSON.stringify(value);
      return this.cookieSet(name, jsonString, options);

    } catch (error) {
      console.error('❌ Error setting JSON cookie:', error);
      return false;
    }
  },

  /**
   * Validate cookie name
   * @param {string} name - Cookie name
   * @returns {boolean} Validation result
   */
  cookieValidateName(name) {
    return typeof name === 'string' && 
           name.length > 0 && 
           name.length <= 255 && 
           this.patterns.cookieName.test(name);
  },

  /**
   * Validate cookie value
   * @param {string} value - Cookie value
   * @returns {boolean} Validation result
   */
  cookieValidateValue(value) {
    return typeof value === 'string' && 
           value.length <= 4096 && 
           this.patterns.cookieValue.test(value);
  },

  /**
   * Check if cookies are enabled in the browser
   * @returns {boolean} Cookie support status
   */
  cookieAreCookiesEnabled() {
    try {
      const testName = '__cookie_test__';
      const testValue = 'test';
      
      this.cookieSet(testName, testValue, { expires: 1 });
      const isEnabled = this.cookieGet(testName) === testValue;
      this.cookieRemove(testName);
      
      return isEnabled;

    } catch (error) {
      return false;
    }
  },

  /**
   * Get cookie size in bytes
   * @param {string} name - Cookie name
   * @returns {number} Size in bytes or -1 if not found
   */
  cookieGetSize(name) {
    const value = this.cookieGet(name);
    
    if (value === null) {
      return -1;
    }

    return new Blob([`${name}=${value}`]).size;
  },

  /**
   * Get total cookies size
   * @returns {number} Total size in bytes
   */
  cookieGetTotalSize() {
    return new Blob([document.cookie]).size;
  }
};
