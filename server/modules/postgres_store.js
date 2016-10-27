/**
 * This module creates a connection to postgres and executes queries.
 * Wrapped connections in promises for async/await use.
 *
 * TODO:
 *   - Set up some try/catch blocks and winston for connection errors
 */

import postgres from 'pg';
import winston from 'winston';
import Config from '../../config';

class PostgresStore {

  constructor() {
    this.connectionUrl = Config.storage.connectionUrl;
    console.log(this.connectionUrl);
  }

  insert(key, data, options = {}) {
    // TODO: Expiration
    return new Promise(async (resolve, reject) => {
      const now = Math.floor(new Date().getTime() / 1000);
      const queryString = 'INSERT INTO entries (key, text, public, name, title, expiration) VALUES ($1, $2, $3, $4, $5, $6)';
      const queryKeys = [key, data.text, data.public, data.name, data.title, now + 100000];
      await this.query(queryString, queryKeys);
      resolve(true);
    });
  }

  getPromise(key, options = {}) {
    return new Promise(async (resolve, reject) => {
      const now = Math.floor(new Date().getTime() / 1000);
      const queryString = 'SELECT * from entries where KEY = $1 and (expiration IS NULL or expiration > $2)';
      const queryKeys = [key, now];
      const { rows } = await this.query(queryString, queryKeys);
      resolve(rows.length ? rows[0] : false);
    });
  }

  /**
   * Wrap some postgres functions in promises
   */
  connect() {
    return new Promise((resolve, reject) => {
      postgres.connect(this.connectionUrl, (err, client, done) => {
        (err) ? reject(err) : resolve({ client, done });
      })
    });
  }

  query(queryString, queryKeys) {
    return new Promise(async (resolve, reject) => {
      const { client, done } = await this.connect();
      client.query(queryString, queryKeys, (err, res) => {
        (err) ? reject(err) : resolve(res);
        done();
      });
    });
  }
}

export default new PostgresStore();