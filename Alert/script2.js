const fs = require('fs');
const Papa = require('papaparse');
const nodemailer = require('nodemailer');

// Define thresholds for anomaly detection
const CO2_THRESHOLD = 21;
const CH4_THRESHOLD = 0.5;

// Configure email transport (using Gmail as an example)
const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
        user: 'jkhushbu970@gmail.com',
        pass: 'muak vdja qmra ovtz'  // Use environment variables for security
    }
});

// Function to send alert email
function sendEmailAlert(anomaly) {
    const mailOptions = {
        from: 'jkhushbu970@gmail.com',
        to: 'akrrish49@gmail.com',
        subject: `Anomaly Detected at ${anomaly.location.latitude}, ${anomaly.location.longitude}`,
        text: `
            Anomaly detected at location (${anomaly.location.latitude}, ${anomaly.location.longitude})
            Date: ${anomaly.date} Time: ${anomaly.time}
            CO2 concentration: ${anomaly.CO2_concentration} (Diff: ${anomaly.CO2_diff})
            CH4 concentration: ${anomaly.CH4_concentration} (Diff: ${anomaly.CH4_diff})
        `
    };

    transporter.sendMail(mailOptions, (error, info) => {
        if (error) {
            return console.error("Error sending email:", error);
        }
        console.log("Email sent:", info.response);
    });
}

// Function to detect anomalies
// This Function detect anomalies on the gas concentration values
function detectAnomalies(data) {
    const anomalies = [];

    for (let i = 1; i < data.length; i++) {
        const prev = data[i - 1];
        const current = data[i];

        const CO2_diff = Math.abs(current.CO2_concentration - prev.CO2_concentration);
        const CH4_diff = Math.abs(current.CH4_concentration - prev.CH4_concentration);

        if (CO2_diff > CO2_THRESHOLD || CH4_diff > CH4_THRESHOLD) {
            const anomaly = {
                index: i,
                message: `Anomaly detected at row ${i + 1}`,
                CO2_concentration: current.CO2_concentration,
                CH4_concentration: current.CH4_concentration,
                CO2_diff: CO2_diff,
                CH4_diff: CH4_diff,
                location: { latitude: current.latitude, longitude: current.longitude },
                date: current.date,
                time: current.time
            };

            anomalies.push(anomaly);
            sendEmailAlert(anomaly); // Send email for each anomaly detected
        }
    }

    return anomalies;
}

// Read and parse the CSV file
try {
    const csvText = fs.readFileSync('data11.csv', 'utf8');
    Papa.parse(csvText, {
        header: true,
        dynamicTyping: true,
        complete: (results) => {
            const data = results.data;

            const formattedData = data.map(row => ({
                latitude: row.latitude,
                longitude: row.longitude,
                altitude: row.altitude,
                speed: row.speed,
                date: row.date,
                time: row.time,
                stop: row.stop,
                humidity: row.humidity,
                temperature: row.temperature,
                tyre_pressure: row.tyre_pressure,
                CO2_concentration: row.CO2_concentration,
                CH4_concentration: row.CH4_concentration
            }));

            const anomalies = detectAnomalies(formattedData);

            if (anomalies.length > 0) {
                console.log("Anomalies detected:", anomalies);
            } else {
                console.log("No significant anomalies detected.");
            }
        },
        error: (error) => {
            console.error("Error parsing CSV:", error);
        }
    });
} catch (error) {
    console.error("Error reading CSV file:", error);
}
