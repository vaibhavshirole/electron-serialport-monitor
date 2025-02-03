// This file is required by the index.html file and will
// be executed in the renderer process for that window.
// All of the Node.js APIs are available in this process.

const { SerialPort } = require('serialport');
const tableify = require('tableify');

let serialPort = null;
let selectedPort = null;
let selectedBaudRate = 9600; // Default baud rate

// Common baud rates
const baudRates = [4800, 9600, 19200, 38400, 57600, 115200];

// Store the last list of ports to detect changes
let lastPorts = [];

async function listSerialPorts() {
    const ports = await SerialPort.list();
    console.log('ports', ports);

    if (ports.length === 0) {
        document.getElementById('error').textContent = 'No ports discovered';
    } else {
        document.getElementById('error').textContent = '';
    }

    // Check if the list of ports has changed
    if (JSON.stringify(ports) !== JSON.stringify(lastPorts)) {
        lastPorts = ports; // Update the lastPorts list
        updatePortDropdown(ports);
    }
}

function updatePortDropdown(ports) {
    const portSelect = document.getElementById('port-select');
    const currentSelection = portSelect.value; // Save the current selection

    // Populate the dropdown with the new list of ports
    portSelect.innerHTML = ports.map(port => 
        `<option value="${port.path}">${port.path} - ${port.manufacturer || 'Unknown'}</option>`
    ).join('');

    // Restore the previous selection if it still exists
    if (ports.some(port => port.path === currentSelection)) {
        portSelect.value = currentSelection;
    } else if (ports.length > 0) {
        portSelect.value = ports[0].path; // Default to the first port if the previous selection is gone
    }
}

function populateBaudRateDropdown() {
    const baudRateSelect = document.getElementById('baud-rate-select');
    baudRateSelect.innerHTML = baudRates.map(rate => 
        `<option value="${rate}">${rate} bps</option>`
    ).join('');
    baudRateSelect.value = selectedBaudRate; // Set default value
}

function listPorts() {
    listSerialPorts();
    setTimeout(listPorts, 2000); // Check for new ports every 2 seconds
}

document.getElementById('connect-button').addEventListener('click', () => {
    const portSelect = document.getElementById('port-select');
    const baudRateSelect = document.getElementById('baud-rate-select');
    selectedPort = portSelect.value;
    selectedBaudRate = parseInt(baudRateSelect.value, 10);

    if (selectedPort) {
        serialPort = new SerialPort({ path: selectedPort, baudRate: selectedBaudRate });

        serialPort.on('open', () => {
            console.log('Serial port opened');
            document.getElementById('connect-button').disabled = true;
            document.getElementById('disconnect-button').disabled = false;
        });

        serialPort.on('data', (data) => {
            const dataDisplay = document.getElementById('data-display');
            dataDisplay.value += data.toString();
            dataDisplay.scrollTop = dataDisplay.scrollHeight; // Auto-scroll to the bottom
        });

        serialPort.on('error', (err) => {
            console.error('Error:', err.message);
        });
    }
});

document.getElementById('disconnect-button').addEventListener('click', () => {
    if (serialPort) {
        serialPort.close(() => {
            console.log('Serial port closed');
            document.getElementById('connect-button').disabled = false;
            document.getElementById('disconnect-button').disabled = true;
        });
    }
});

// Populate baud rate dropdown on page load
populateBaudRateDropdown();

// Set a timeout that will check for new serialPorts every 2 seconds.
// This timeout reschedules itself.
setTimeout(listPorts, 2000);

listSerialPorts();
