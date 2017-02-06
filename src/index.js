import angular from 'angular';

(((ng) => {
  class CookieManager {
    static getItem(key) {
      const result = document.cookie.match(new RegExp(`${key}=([^;]+)`));
      return result ? JSON.parse(result[1]) : '';
    }
    static setItem(key, value, exdays) {
      const expires = (() => {
        if (!exdays) { return ''; }
        const date = new Date();
        date.setTime(date.getTime() + (exdays * 24 * 60 * 60 * 1000));
        return `; expires=" + ${date.toGMTString()}`;
      })();
      document.cookie = `${key}=${JSON.stringify(value)}; 
        domain=.${window.location.host.toString()},
        ${expires}; path=/;`;
      return value === this.getItem(key);
    }
    static removeItem(key) {
      return this.setItem(key, '', -1);
    }
    static clear() {
      const cookies = document
        .cookie
        .split(';');
      for (let i = 0; i < cookies.length; i += 1) {
        const cookie = cookies[i];
        const eqPos = cookie.indexOf('=');
        const name = eqPos > -1
          ? cookie.substr(0, eqPos)
          : cookie;
        this.setCookie(name, '', -1);
      }
    }
  }

  class Storage {
    constructor(storageName) {
      this.storage = window[storageName];
    }
    getItem(key) {
      const entry = JSON.parse(this.storage.getItem(key) || '0');
      if (!entry) { return ''; }
      if (entry.ttl && entry.ttl + entry.now < new Date()) {
        this.storage.removeItem(key);
        return '';
      }
      return entry.value;
    }
    setItem (key, value, ttl) {
      this.storage.setItem(key, JSON.stringify({
        ttl: ttl || 0,
        now: new Date(),
        value
      }));
      return this.getItem(key) === value;
    }
    removeItem(key) {
      this.storage.removeItem(key);
    }
    clear() {
      this.storage.clear();
    }
  }

  const isStorageSupported = ((() => {
    const key = '__test__';
    try {
      window.localStorage.setItem(key, key);
      window.localStorage.removeItem(key);
      return true;
    } catch (err) {
      return false;
    }
  })());

  const service = () => ({
    localStorage: isStorageSupported ? new Storage('localStorage') : CookieManager,
    sessionStorage: isStorageSupported ? new Storage('sessionStorage') : CookieManager,
    cookie: CookieManager
  });

  ng
    .module('ng-one-storage', [])
    .service('ngOneStorage', service);
})(angular));
