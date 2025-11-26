const { app, BrowserWindow, ipcMain, dialog } = require('electron');
const path = require('path');
const fs = require('fs');
const Database = require('better-sqlite3');
const nodemailer = require('nodemailer');
const archiver = require('archiver');
const Store = require('electron-store');

const isMac = process.platform === 'darwin';
const dbPath = path.join(__dirname, 'database', 'fancyfoods.db');
const attachmentsDir = path.join(__dirname, 'attachments');
const emailsDir = path.join(__dirname, 'emails');
const backupDir = path.join(__dirname, 'backup');
const store = new Store({ name: 'fancyfoods-config' });
let db;

function ensureDirectories() {
  [attachmentsDir, emailsDir, backupDir, path.dirname(dbPath)].forEach((dir) => {
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
  });
}

function initDatabase() {
  ensureDirectories();
  db = new Database(dbPath);
  db.pragma('journal_mode = WAL');

  db.prepare(
    `CREATE TABLE IF NOT EXISTS products (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      category TEXT,
      unit TEXT,
      price REAL DEFAULT 0,
      notes TEXT
    );`
  ).run();

  db.prepare(
    `CREATE TABLE IF NOT EXISTS clients (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      phone TEXT,
      whatsapp TEXT,
      city TEXT,
      notes TEXT
    );`
  ).run();

  db.prepare(
    `CREATE TABLE IF NOT EXISTS broker_deals (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      trader_name TEXT,
      product TEXT,
      quantity REAL,
      price_per_ton REAL,
      supplier TEXT,
      status TEXT,
      notes TEXT
    );`
  ).run();

  db.prepare(
    `CREATE TABLE IF NOT EXISTS orders (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      client_id INTEGER,
      order_date TEXT,
      total_price REAL DEFAULT 0,
      FOREIGN KEY(client_id) REFERENCES clients(id)
    );`
  ).run();

  db.prepare(
    `CREATE TABLE IF NOT EXISTS order_items (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      order_id INTEGER,
      product_id INTEGER,
      quantity REAL,
      price REAL,
      FOREIGN KEY(order_id) REFERENCES orders(id),
      FOREIGN KEY(product_id) REFERENCES products(id)
    );`
  ).run();

  db.prepare(
    `CREATE TABLE IF NOT EXISTS email_templates (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      subject TEXT,
      body TEXT
    );`
  ).run();
}

function createWindow() {
  const mainWindow = new BrowserWindow({
    width: 1200,
    height: 800,
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: false
    }
  });

  mainWindow.loadFile(path.join(__dirname, 'renderer', 'index.html'));
}

app.whenReady().then(() => {
  initDatabase();
  createWindow();

  app.on('activate', function () {
    if (BrowserWindow.getAllWindows().length === 0) createWindow();
  });
});

app.on('window-all-closed', function () {
  if (!isMac) app.quit();
});

function handleError(error) {
  console.error(error);
  return { success: false, error: error.message };
}

ipcMain.handle('products:list', () => {
  try {
    const rows = db.prepare('SELECT * FROM products ORDER BY name').all();
    return { success: true, data: rows };
  } catch (error) {
    return handleError(error);
  }
});

ipcMain.handle('products:search', (_event, term) => {
  try {
    const rows = db
      .prepare('SELECT * FROM products WHERE name LIKE ? OR category LIKE ? ORDER BY name')
      .all(`%${term}%`, `%${term}%`);
    return { success: true, data: rows };
  } catch (error) {
    return handleError(error);
  }
});

ipcMain.handle('products:save', (_event, product) => {
  try {
    if (product.id) {
      db.prepare('UPDATE products SET name=?, category=?, unit=?, price=?, notes=? WHERE id=?').run(
        product.name,
        product.category,
        product.unit,
        product.price,
        product.notes,
        product.id
      );
      return { success: true, data: product.id };
    }
    const result = db
      .prepare('INSERT INTO products (name, category, unit, price, notes) VALUES (?,?,?,?,?)')
      .run(product.name, product.category, product.unit, product.price, product.notes);
    return { success: true, data: result.lastInsertRowid };
  } catch (error) {
    return handleError(error);
  }
});

ipcMain.handle('products:delete', (_event, id) => {
  try {
    db.prepare('DELETE FROM products WHERE id=?').run(id);
    return { success: true };
  } catch (error) {
    return handleError(error);
  }
});

ipcMain.handle('clients:list', () => {
  try {
    const rows = db.prepare('SELECT * FROM clients ORDER BY name').all();
    return { success: true, data: rows };
  } catch (error) {
    return handleError(error);
  }
});

ipcMain.handle('clients:search', (_event, term) => {
  try {
    const rows = db
      .prepare('SELECT * FROM clients WHERE name LIKE ? OR phone LIKE ? ORDER BY name')
      .all(`%${term}%`, `%${term}%`);
    return { success: true, data: rows };
  } catch (error) {
    return handleError(error);
  }
});

ipcMain.handle('clients:save', (_event, client) => {
  try {
    if (client.id) {
      db.prepare('UPDATE clients SET name=?, phone=?, whatsapp=?, city=?, notes=? WHERE id=?').run(
        client.name,
        client.phone,
        client.whatsapp,
        client.city,
        client.notes,
        client.id
      );
      return { success: true, data: client.id };
    }
    const result = db
      .prepare('INSERT INTO clients (name, phone, whatsapp, city, notes) VALUES (?,?,?,?,?)')
      .run(client.name, client.phone, client.whatsapp, client.city, client.notes);
    return { success: true, data: result.lastInsertRowid };
  } catch (error) {
    return handleError(error);
  }
});

ipcMain.handle('clients:delete', (_event, id) => {
  try {
    db.prepare('DELETE FROM clients WHERE id=?').run(id);
    return { success: true };
  } catch (error) {
    return handleError(error);
  }
});

ipcMain.handle('broker:list', () => {
  try {
    const rows = db.prepare('SELECT * FROM broker_deals ORDER BY id DESC').all();
    return { success: true, data: rows };
  } catch (error) {
    return handleError(error);
  }
});

ipcMain.handle('broker:save', (_event, deal) => {
  try {
    if (deal.id) {
      db.prepare(
        'UPDATE broker_deals SET trader_name=?, product=?, quantity=?, price_per_ton=?, supplier=?, status=?, notes=? WHERE id=?'
      ).run(
        deal.trader_name,
        deal.product,
        deal.quantity,
        deal.price_per_ton,
        deal.supplier,
        deal.status,
        deal.notes,
        deal.id
      );
      return { success: true, data: deal.id };
    }
    const result = db
      .prepare(
        'INSERT INTO broker_deals (trader_name, product, quantity, price_per_ton, supplier, status, notes) VALUES (?,?,?,?,?,?,?)'
      )
      .run(deal.trader_name, deal.product, deal.quantity, deal.price_per_ton, deal.supplier, deal.status, deal.notes);
    const newId = result.lastInsertRowid;
    const dir = path.join(attachmentsDir, String(newId));
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
    return { success: true, data: newId };
  } catch (error) {
    return handleError(error);
  }
});

ipcMain.handle('broker:delete', (_event, id) => {
  try {
    db.prepare('DELETE FROM broker_deals WHERE id=?').run(id);
    const dir = path.join(attachmentsDir, String(id));
    if (fs.existsSync(dir)) {
      fs.rmSync(dir, { recursive: true, force: true });
    }
    return { success: true };
  } catch (error) {
    return handleError(error);
  }
});

ipcMain.handle('broker:attachment-path', (_event, id) => {
  const dir = path.join(attachmentsDir, String(id));
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
  return { success: true, data: dir };
});

ipcMain.handle('broker:attach-file', async (_event, id) => {
  try {
    const result = await dialog.showOpenDialog({
      properties: ['openFile'],
      filters: [
        { name: 'Documents', extensions: ['pdf', 'png', 'jpg', 'jpeg', 'gif'] },
        { name: 'All Files', extensions: ['*'] }
      ]
    });
    if (result.canceled || !result.filePaths.length) return { success: false, error: 'No file selected' };
    const dir = path.join(attachmentsDir, String(id));
    ensureDirectories();
    if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
    const source = result.filePaths[0];
    const filename = path.basename(source);
    const destination = path.join(dir, filename);
    fs.copyFileSync(source, destination);
    return { success: true, data: filename };
  } catch (error) {
    return handleError(error);
  }
});

ipcMain.handle('orders:list', () => {
  try {
    const rows = db
      .prepare(
        `SELECT orders.*, clients.name AS client_name FROM orders
         LEFT JOIN clients ON orders.client_id = clients.id
         ORDER BY order_date DESC`
      )
      .all();
    return { success: true, data: rows };
  } catch (error) {
    return handleError(error);
  }
});

ipcMain.handle('orders:items', (_event, orderId) => {
  try {
    const rows = db
      .prepare(
        `SELECT order_items.*, products.name AS product_name FROM order_items
         LEFT JOIN products ON order_items.product_id = products.id WHERE order_id=?`
      )
      .all(orderId);
    return { success: true, data: rows };
  } catch (error) {
    return handleError(error);
  }
});

ipcMain.handle('orders:save', (_event, order) => {
  const transaction = db.transaction((data) => {
    let orderId = data.id;
    if (orderId) {
      db.prepare('DELETE FROM order_items WHERE order_id=?').run(orderId);
      db.prepare('UPDATE orders SET client_id=?, order_date=?, total_price=? WHERE id=?').run(
        data.client_id,
        data.order_date,
        data.total_price,
        orderId
      );
    } else {
      const result = db
        .prepare('INSERT INTO orders (client_id, order_date, total_price) VALUES (?,?,?)')
        .run(data.client_id, data.order_date, data.total_price);
      orderId = result.lastInsertRowid;
    }

    const insertItem = db.prepare(
      'INSERT INTO order_items (order_id, product_id, quantity, price) VALUES (?,?,?,?)'
    );
    data.items.forEach((item) => insertItem.run(orderId, item.product_id, item.quantity, item.price));
    return orderId;
  });

  try {
    const newId = transaction(order);
    return { success: true, data: newId };
  } catch (error) {
    return handleError(error);
  }
});

ipcMain.handle('orders:delete', (_event, id) => {
  try {
    db.prepare('DELETE FROM order_items WHERE order_id=?').run(id);
    db.prepare('DELETE FROM orders WHERE id=?').run(id);
    return { success: true };
  } catch (error) {
    return handleError(error);
  }
});

ipcMain.handle('templates:list', () => {
  try {
    const rows = db.prepare('SELECT * FROM email_templates ORDER BY name').all();
    return { success: true, data: rows };
  } catch (error) {
    return handleError(error);
  }
});

ipcMain.handle('templates:save', (_event, template) => {
  try {
    if (template.id) {
      db.prepare('UPDATE email_templates SET name=?, subject=?, body=? WHERE id=?').run(
        template.name,
        template.subject,
        template.body,
        template.id
      );
      return { success: true, data: template.id };
    }
    const result = db
      .prepare('INSERT INTO email_templates (name, subject, body) VALUES (?,?,?)')
      .run(template.name, template.subject, template.body);
    return { success: true, data: result.lastInsertRowid };
  } catch (error) {
    return handleError(error);
  }
});

ipcMain.handle('templates:delete', (_event, id) => {
  try {
    db.prepare('DELETE FROM email_templates WHERE id=?').run(id);
    return { success: true };
  } catch (error) {
    return handleError(error);
  }
});

ipcMain.handle('email:send', async (_event, payload) => {
  try {
    const { to, subject, body, smtp } = payload;
    const transporter = nodemailer.createTransport({
      service: 'hotmail',
      auth: {
        user: smtp.user,
        pass: smtp.pass
      }
    });

    const info = await transporter.sendMail({
      from: smtp.user,
      to,
      subject,
      html: body
    });

    const filename = `${Date.now()}-${subject.replace(/\s+/g, '-') || 'email'}.html`;
    fs.writeFileSync(path.join(emailsDir, filename), body, 'utf8');
    return { success: true, data: info }; 
  } catch (error) {
    return handleError(error);
  }
});

ipcMain.handle('email:save-local', (_event, payload) => {
  try {
    const { subject, body } = payload;
    const filename = `${Date.now()}-${subject.replace(/\s+/g, '-') || 'draft'}.html`;
    fs.writeFileSync(path.join(emailsDir, filename), body, 'utf8');
    return { success: true, data: filename };
  } catch (error) {
    return handleError(error);
  }
});

ipcMain.handle('config:get', () => {
  return { success: true, data: store.store };
});

ipcMain.handle('config:set', (_event, data) => {
  store.set(data);
  return { success: true };
});

ipcMain.handle('backup:export', async () => {
  try {
    ensureDirectories();
    const dateStr = new Date().toISOString().split('T')[0];
    const zipName = `fancyfoods-backup-${dateStr}.zip`;
    const destination = path.join(backupDir, zipName);

    await new Promise((resolve, reject) => {
      const output = fs.createWriteStream(destination);
      const archive = archiver('zip', { zlib: { level: 9 } });

      output.on('close', resolve);
      archive.on('error', reject);

      archive.pipe(output);
      archive.file(dbPath, { name: 'fancyfoods.db' });
      archive.directory(attachmentsDir, 'attachments');
      archive.directory(emailsDir, 'emails');
      archive.finalize();
    });

    return { success: true, data: destination };
  } catch (error) {
    return handleError(error);
  }
});

ipcMain.handle('backup:import', async () => {
  try {
    const result = await dialog.showOpenDialog({
      properties: ['openFile'],
      filters: [{ name: 'FancyFoods Backup', extensions: ['zip', 'fancybackup'] }]
    });

    if (result.canceled || !result.filePaths.length) {
      return { success: false, error: 'Import cancelled' };
    }
    const file = result.filePaths[0];
    const unzipper = require('adm-zip');
    const zip = new unzipper(file);
    ensureDirectories();
    zip.extractEntryTo('fancyfoods.db', path.dirname(dbPath), false, true);
    zip.extractEntryTo('attachments/', attachmentsDir, false, true);
    zip.extractEntryTo('emails/', emailsDir, false, true);
    initDatabase();
    return { success: true };
  } catch (error) {
    return handleError(error);
  }
});

require('./preload');
