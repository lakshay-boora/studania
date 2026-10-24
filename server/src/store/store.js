'use strict';
/**
 * Angvey > store
 *
 * Dependency-free, atomic JSON persistence. Chosen deliberately: an institute
 * running the Paathshala tier can back up the whole student database by
 * copying one folder, and the MVP has zero DB provisioning cost.
 *
 * Interface mirrors a DB collection so swapping to SQLite/Postgres later is
 * a single-file change.
 */

const fs = require('fs');
const path = require('path');
const config = require('../config');

const COLLECTIONS = ['users', 'chats', 'attempts', 'revisions'];

class JsonStore {
  constructor(dir = config.runtimeDir) {
    this.dir = dir;
    this.cache = new Map();
    this.dirty = new Set();
    this._ensureDir();
    for (const c of COLLECTIONS) this._load(c);
    // flush dirty collections periodically
    this.timer = setInterval(() => this.flush(), 4000);
    this.timer.unref?.();
  }

  _ensureDir() {
    fs.mkdirSync(this.dir, { recursive: true });
  }

  _file(c) {
    return path.join(this.dir, `${c}.json`);
  }

  _load(c) {
    try {
      const raw = fs.readFileSync(this._file(c), 'utf8');
      const data = JSON.parse(raw);
      this.cache.set(c, Array.isArray(data) ? data : []);
    } catch {
      this.cache.set(c, []);
    }
  }

  _markDirty(c) {
    this.dirty.add(c);
  }

  flush() {
    for (const c of [...this.dirty]) {
      const data = this.cache.get(c) || [];
      const tmp = `${this._file(c)}.tmp`;
      try {
        fs.writeFileSync(tmp, JSON.stringify(data, null, 2));
        fs.renameSync(tmp, this._file(c)); // atomic on POSIX
        this.dirty.delete(c);
      } catch (err) {
        console.error(`[angvey] store flush failed for ${c}:`, err.message);
      }
    }
  }

  // ---- collection-ish helpers ------------------------------------------

  all(c) {
    return this.cache.get(c) || [];
  }

  insert(c, doc) {
    const withMeta = { ...doc, createdAt: doc.createdAt || new Date().toISOString() };
    this.all(c).push(withMeta);
    this._markDirty(c);
    return withMeta;
  }

  update(c, predicate, patch) {
    const list = this.all(c);
    let changed = 0;
    for (const item of list) {
      if (predicate(item)) {
        Object.assign(item, typeof patch === 'function' ? patch(item) : patch);
        changed++;
      }
    }
    if (changed) this._markDirty(c);
    return changed;
  }

  find(c, predicate) {
    return this.all(c).filter(predicate);
  }

  findOne(c, predicate) {
    return this.all(c).find(predicate) || null;
  }

  remove(c, predicate) {
    const list = this.all(c);
    const kept = list.filter((x) => !predicate(x));
    this.cache.set(c, kept);
    this._markDirty(c);
    return list.length - kept.length;
  }

  // ---- domain helpers ---------------------------------------------------

  getOrCreateUser(userId, defaults = {}) {
    let user = this.findOne('users', (u) => u.id === userId);
    if (!user) {
      user = this.insert('users', {
        id: userId,
        name: defaults.name || 'Aspirant',
        exam: defaults.exam || 'JEE',
        plan: 'sahaj',
        streak: 0,
        lastActiveDate: null,
        doubtsToday: 0,
        doubtsDate: null,
      });
    }
    return user;
  }

  touchUser(userId, { exam, name } = {}) {
    const user = this.getOrCreateUser(userId);
    const today = new Date().toISOString().slice(0, 10);
    const patch = {};

    if (exam) patch.exam = exam;
    if (name) patch.name = name;

    // daily quota reset
    if (user.doubtsDate !== today) {
      patch.doubtsDate = today;
      patch.doubtsToday = 0;
    }
    // streak bookkeeping
    if (user.lastActiveDate !== today) {
      const yesterday = new Date(Date.now() - 86400000).toISOString().slice(0, 10);
      const streak = user.lastActiveDate === yesterday ? (user.streak || 0) + 1 : 1;
      patch.streak = streak;
      patch.lastActiveDate = today;
    }
    if (Object.keys(patch).length) {
      this.update('users', (u) => u.id === userId, patch);
      Object.assign(user, patch);
    }
    return user;
  }

  bumpDoubts(userId) {
    const today = new Date().toISOString().slice(0, 10);
    this.update('users', (u) => u.id === userId, (u) =>
      u.doubtsDate === today ? { doubtsToday: (u.doubtsToday || 0) + 1 } : { doubtsDate: today, doubtsToday: 1 }
    );
    return this.getOrCreateUser(userId);
  }
}

module.exports = { JsonStore };
