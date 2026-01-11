import { Client as KVClient } from '@vercel/kv';
import { CONFIG } from './config.js';

const kv = new KVClient();

export const Cache = {
  async getOrFetch(key, fetchFn, ttl = CONFIG.TTL.WORK) {
    try {
      const cached = await kv.get(`${CONFIG.PREFIX}:${key}`);
      
      if (cached) {
        console.log(`[Cache] ✅ HIT: ${key}`);
        return JSON.parse(cached.value);
      }
      
      console.log(`[Cache] ❌ MISS: ${key}`);
      
      const data = await fetchFn();
      
      await this.setWithLRU(key, data, ttl);
      
      return data;
    } catch (error) {
      console.error('[Cache] Error:', error.message);
      
      return fetchFn().catch(() => null);
    }
  },
  
  async setWithLRU(key, value, ttl = CONFIG.TTL.WORK) {
    try {
      const fullKey = `${CONFIG.PREFIX}:${key}`;
      
      const currentCount = await this.getKeyCount();
      
      if (currentCount >= CONFIG.MAX_KEYS) {
        await this.evictLRU();
      }
      
      await kv.set(fullKey, JSON.stringify(value), { ex: ttl });
      
      await kv.set(`${CONFIG.PREFIX}:access:${Date.now()}`, fullKey);
      
      console.log(`[Cache] ✅ SET: ${key} (TTL: ${ttl}s)`);
    } catch (error) {
      console.error('[Cache] Error guardando:', error.message);
    }
  },
  
  async getKeyCount() {
    try {
      const keys = await kv.keys({ prefix: CONFIG.PREFIX, limit: 256 });
      return keys.length;
    } catch (error) {
      return 0;
    }
  },
  
  async evictLRU() {
    try {
      const accessKeys = await kv.keys({ 
        prefix: `${CONFIG.PREFIX}:access:`,
        limit: 50 
      });
      
      if (accessKeys.length === 0) return;
      
      const oldestAccess = accessKeys[0];
      const value = await kv.get(oldestAccess.name);
      
      if (value) {
        const workKey = value.value;
        await kv.del(workKey);
        await kv.del(oldestAccess.name);
        
        console.log(`[Cache] 🗑️ LRU Evicted: ${workKey}`);
      }
    } catch (error) {
      console.error('[Cache] Error en evicción LRU:', error.message);
    }
  },
  
  async invalidateSearch(pattern) {
    try {
      const keys = await kv.keys({ 
        prefix: `${CONFIG.PREFIX}:search:${pattern}`,
        limit: 100 
      });
      
      for (const key of keys) {
        await kv.del(key.name);
      }
      
      console.log(`[Cache] 🗑️ Invalidadas ${keys.length} búsquedas con patrón: ${pattern}`);
    } catch (error) {
      console.error('[Cache] Error invalidando:', error.message);
    }
  },
  
  async invalidateWork(slug) {
    try {
      const workKey = `${CONFIG.PREFIX}:work:${slug}`;
      await kv.del(workKey);
      
      console.log(`[Cache] 🗑️ Invalidada obra: ${slug}`);
    } catch (error) {
      console.error('[Cache] Error invalidando:', error.message);
    }
  }
};
