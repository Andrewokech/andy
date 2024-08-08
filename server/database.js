const sql = require('mssql');
const fs = require('fs');
const path = require('path');

const config = {
    user: 'andy',
    password: 'okech016',
    server: 'ANDREW\\SQLEXPRESS',
    database: 'dashboard',
    options: {
        encrypt: true,
        trustServerCertificate: true 
    }
};

const localDataFile = path.join(__dirname, '..', 'public', 'assets', 'js', 'local_data.json');

async function connectToDatabase() {
    try {
        const pool = await sql.connect(config);
        console.log('Connected to MSSQL database');
        return pool;
    } catch (error) {
        console.error('Error connecting to MSSQL database:', error.message);
        throw error;
    }
}

function saveDataLocally(key, data) {
    let localData = {};
    if (fs.existsSync(localDataFile)) {
        localData = JSON.parse(fs.readFileSync(localDataFile, 'utf-8'));
    }
    localData[key] = data;
    fs.writeFileSync(localDataFile, JSON.stringify(localData, null, 2));
}

function loadDataFromLocal(key) {
    if (fs.existsSync(localDataFile)) {
        const data = JSON.parse(fs.readFileSync(localDataFile, 'utf-8'));
        return data[key] || [];
    }
    return [];
}

const CACHE_EXPIRATION_TIME = 60 * 60 * 1000;

async function fetchDataFromDatabase() {
    try {
        const cachedData = loadDataFromLocal('combinedData');
        if (cachedData && (Date.now() - cachedData.timestamp < CACHE_EXPIRATION_TIME)) {
            console.log('Loaded combined data from cache');
            return cachedData.data;
        }

        const pool = await connectToDatabase();
        const zoneResult = await pool.request().query('SELECT * FROM zone');
        const entryCountResult = await pool.request().query('SELECT * FROM entry_count');
        const exitCountResult = await pool.request().query('SELECT * FROM exit_count');
        const dateResult = await pool.request().query('SELECT * FROM date');

        const zones = zoneResult.recordset;
        const entryCounts = entryCountResult.recordset;
        const exitCounts = exitCountResult.recordset;
        const dates = dateResult.recordset;

        const combinedData = zones.map(zone => {
            const entryCount = entryCounts.find(entry => entry.zone === zone.zone);
            const exitCount = exitCounts.find(exit => exit.zone === zone.zone);
            const date = dates.find(date => date.zone === zone.zone);

            return {
                zone: zone.zone,
                entry_count: entryCount ? entryCount.entry_count : null,
                exit_count: exitCount ? exitCount.exit_count : null,
                date: date ? date.date : null
            };
        });

        saveDataLocally('combinedData', {
            data: combinedData,
            timestamp: Date.now()
        });
        return combinedData;

    } catch (error) {
        console.error('Error fetching data from database:', error.message);
        return loadDataFromLocal('combinedData') || [];
    }
}

async function fetchChart1DataFromDatabase() {
    try {
        const cachedData = loadDataFromLocal('chart1Data');
        if (cachedData && (Date.now() - cachedData.timestamp < CACHE_EXPIRATION_TIME)) {
            console.log('Loaded chart 1 data from cache');
            return cachedData.data;
        }

        const pool = await connectToDatabase();
        const chart1Result = await pool.request().query('SELECT * FROM chart1_data');
        const data = chart1Result.recordset;
        saveDataLocally('chart1Data', {
            data,
            timestamp: Date.now()
        });
        return data;
    } catch (error) {
        console.error('Error fetching chart 1 data from database:', error.message);
        return loadDataFromLocal('chart1Data') || [];
    }
}

async function fetchChart2DataFromDatabase() {
    try {
        const cachedData = loadDataFromLocal('chart2Data');
        if (cachedData && (Date.now() - cachedData.timestamp < CACHE_EXPIRATION_TIME)) {
            console.log('Loaded chart 2 data from cache');
            return cachedData.data;
        }

        const pool = await connectToDatabase();
        const chart2Result = await pool.request().query('SELECT * FROM chart2_data');
        const data = chart2Result.recordset;
        saveDataLocally('chart2Data', {
            data,
            timestamp: Date.now()
        });
        return data;
    } catch (error) {
        console.error('Error fetching chart 2 data from database:', error.message);
        return loadDataFromLocal('chart2Data') || [];
    }
}

module.exports = {
    fetchDataFromDatabase,
    fetchChart1DataFromDatabase,
    fetchChart2DataFromDatabase,
    connectToDatabase
};
