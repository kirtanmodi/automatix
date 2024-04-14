import React, { useCallback, useState } from "react";
import { useDropzone } from "react-dropzone";
import * as XLSX from "xlsx";
import { jsPDF } from "jspdf";
import "jspdf-autotable";
import { format } from "date-fns";
import moment from "moment";
import momnetTz from "moment-timezone";

import styled from "@emotion/styled";
import { Button, Paper, Typography } from "@mui/material";

const FIRST_ROW = 10;
const SECOND_ROW = 200;
const THIRD_ROW = 470;

const BOOKING_COL = 20;
// const NAME_COL = BOOKING_COL + 10;
// const DAT_COL = NAME_COL + 10;

const FIRST_COL = BOOKING_COL + 18;
const SECOND_COL = FIRST_COL + 15;
const THIRD_COL = SECOND_COL + 15;
const FOURTH_COL = THIRD_COL + 15;
const FIFTH_COL = FOURTH_COL + 15;
const SIXTH_COL = FIFTH_COL + 15;
const SEVENTH_COL = SIXTH_COL + 15;
const EIGHTH_COL = SEVENTH_COL + 15;
const NINTH_COL = EIGHTH_COL + 15;

const RECT_WIDTH = THIRD_ROW + 200;
const RECT_HEIGHT = EIGHTH_COL + 15;

const App = () => {
  const [jsonToPrint, setJsonToPrint] = useState([]);
  const [isFileUploaded, setIsFileUploaded] = useState(false);
  const [fileName, setFileName] = useState("");
  const onDrop = useCallback((acceptedFiles) => {
    acceptedFiles.forEach((file) => {
      setFileName(file.name); // Set the name of the file for displaying
      const fileExtension = file.name.split(".").pop();
      if (fileExtension !== "xls" && fileExtension !== "xlsx") {
        alert("Please upload an Excel file.");
        return;
      }

      const reader = new FileReader();

      reader.onload = (event) => {
        try {
          const { result } = event.target;
          const workbook = XLSX.read(result, { type: "binary" });

          const worksheetName = workbook.SheetNames[0];
          const worksheet = workbook.Sheets[worksheetName];

          const data = XLSX.utils.sheet_to_json(worksheet, { header: 1 });
          if (data.length > 0) {
            const keys = data[0];
            const jsonData = data.slice(1).map((row) => {
              let obj = {};
              row.forEach((value, index) => {
                obj[keys[index]] = value;
              });
              return obj;
            });

            console.log(jsonData); // Keeping this for debug purposes
            setJsonToPrint(jsonData);
            setIsFileUploaded(true);
          }
        } catch (error) {
          console.error("Error reading the file:", error);
          alert("Error processing the file, please check the console for details.");
          setIsFileUploaded(false);
          setFileName("");
        }
      };

      reader.onerror = (error) => {
        console.error("Error reading the file:", error);
        alert("Error reading the file, please check the console for details.");
        setIsFileUploaded(false);
        setFileName("");
      };

      reader.readAsBinaryString(file);
    });
  }, []);
  const downloadPDF = (jsonData) => {
    const pdf = new jsPDF({
      orientation: "landscape",
      unit: "pt",
      format: "a4",
    });

    let entriesPerPage = 3;
    let entriesCurrentPage = 0;
    let startY = 20;

    jsonData.forEach((data, index) => {
      if (entriesCurrentPage >= entriesPerPage) {
        pdf.addPage();
        entriesCurrentPage = 0;
        startY = 20;
      }

      const tripStartDate = data["Trip Start Date"];
      const epochStart = "1899-12-30";
      const formattedDate = moment(epochStart).add(tripStartDate, "days").format("Do MMMM YYYY");

      // Header information
      pdf.setFontSize(12);
      pdf.setFont("helvetica", "bold");
      pdf.text(`Booking #: ${data["Booking #"] || "N/A"}`, FIRST_ROW, startY + BOOKING_COL);
      pdf.setFont("helvetica", "normal");
      pdf.setFontSize(10);
      pdf.text(`Name: ${data["Guest Name"] || "N/A"}`, SECOND_ROW, startY + BOOKING_COL);
      pdf.text(`Date: ${formattedDate}`, THIRD_ROW, startY + BOOKING_COL);

      // Draw a horizontal line before the first section
      const distanceFromTop = startY + BOOKING_COL + 6;
      pdf.line(10, distanceFromTop, RECT_WIDTH - 10, distanceFromTop);

      // FIRST SECTION
      pdf.setFontSize(10);
      pdf.setFont("helvetica", "bold");
      pdf.text(`Service: ${data["Item Category 1"] || "N/A"}`, FIRST_ROW, startY + FIRST_COL);
      pdf.text(`Coach: ${data["Ord # 1"] || "N/A"}`, FIRST_ROW, startY + SECOND_COL);
      pdf.text(`Seat: ${data["Seat # 1"] || "N/A"}`, FIRST_ROW, startY + THIRD_COL);
      pdf.setFont("helvetica", "normal");

      const startCity = data["Guest Route Start City"] === "Vancouver" ? "Vancouver Train Station" : data["Guest Route Start City"] || "N/A";
      pdf.text(`From: ${startCity}`, SECOND_ROW, startY + FIRST_COL);
      const firstHotelStart = data["Pre-Rail Accommodation 1"] ? data["Pre-Rail Accommodation 1"] : "N/A";
      pdf.text(`Hotel: ${firstHotelStart}`, SECOND_ROW, startY + SECOND_COL);
      const Transfer1 = data["Pre-Rail Transfer Pickup 1"] === "No Pre-Rail Transfer Pickup" ? "N/A" : data["Pre-Rail Transfer Pickup 1"] || "N/A";
      pdf.text(`Transfer: ${Transfer1}`, SECOND_ROW, startY + THIRD_COL);

      const endCity = data["Mgmt Leg 1"] === "Vancouver - Kamloops" ? "Kamloops Train Station" : data["Guest Route End City"] || "N/A";
      pdf.text(`To: ${endCity}`, THIRD_ROW, startY + FIRST_COL);
      const firstHotelEnd = data["Accommodation Item Name - Same Day 1"] ? data["Accommodation Item Name - Same Day 1"] : "N/A";
      pdf.text(`Hotel: ${firstHotelEnd}`, THIRD_ROW, startY + SECOND_COL);
      const Transfer2 = data["Post-Rail Transfer Pickup 1"] === "No Post-Rail Transfer Pickup" ? "N/A" : data["Post-Rail Transfer Pickup 1"] || "N/A";
      pdf.text(`Transfer: ${Transfer2}`, THIRD_ROW, startY + THIRD_COL);

      // Draw a horizontal line before the next section
      const distanceFromTopForNextSection = startY + THIRD_COL + 6;
      pdf.line(10, distanceFromTopForNextSection, RECT_WIDTH - 10, distanceFromTopForNextSection);

      // SECOND SECTION
      pdf.setFontSize(10);
      pdf.setFont("helvetica", "bold");
      pdf.text(`Service: ${data["Item Category 2"] || "N/A"}`, FIRST_ROW, startY + FOURTH_COL);
      pdf.text(`Coach: ${data["Ord # 2"] || "N/A"}`, FIRST_ROW, startY + FIFTH_COL);
      pdf.text(`Seat: ${data["Seat # 2"] || "N/A"}`, FIRST_ROW, startY + SIXTH_COL);
      pdf.setFont("helvetica", "normal");

      const startCity2 = data["Guest Route Start City"] === "Vancouver" ? "Vancouver Train Station" : data["Guest Route Start City"] || "N/A";
      pdf.text(`From: ${startCity2}`, SECOND_ROW, startY + FOURTH_COL);
      const secondHotelStart = data["Pre-Rail Accommodation 2"] ? data["Pre-Rail Accommodation 2"] : "N/A";
      pdf.text(`Hotel: ${secondHotelStart}`, SECOND_ROW, startY + FIFTH_COL);
      const Transfer3 = data["Pre-Rail Transfer Pickup 3"] === "No Pre-Rail Transfer Pickup" ? "N/A" : data["Pre-Rail Transfer Pickup 3"] || "N/A";
      pdf.text(`Transfer: ${Transfer3}`, SECOND_ROW, startY + SIXTH_COL);

      const endCity2 = data["Mgmt Leg 2"] === "Vancouver - Kamloops" ? "Kamloops Train Station" : data["Guest Route End City"] || "N/A";
      pdf.text(`To: ${endCity2}`, THIRD_ROW, startY + FOURTH_COL);
      const secondHotelEnd = data["Accommodation Item Name - Same Day 2"] ? data["Accommodation Item Name - Same Day 2"] : "N/A";
      pdf.text(`Hotel: ${secondHotelEnd}`, THIRD_ROW, startY + FIFTH_COL);
      const Transfer4 = data["Post-Rail Transfer Pickup 2"] === "No Post-Rail Transfer Pickup" ? "N/A" : data["Post-Rail Transfer Pickup 2"] || "N/A";
      pdf.text(`Transfer: ${Transfer4}`, THIRD_ROW, startY + SIXTH_COL);

      // Draw a horizontal line before the third section
      const distanceFromTopForThirdSection = startY + SIXTH_COL + 6;
      pdf.line(10, distanceFromTopForThirdSection, RECT_WIDTH - 10, distanceFromTopForThirdSection);

      // THIRD SECTION
      pdf.setFontSize(10);
      pdf.setFont("helvetica", "bold");
      pdf.text(`Service: ${data["Item Category 3"] || "N/A"}`, FIRST_ROW, startY + SEVENTH_COL);
      pdf.text(`Coach: ${data["Ord # 3"] || "N/A"}`, FIRST_ROW, startY + EIGHTH_COL);
      pdf.text(`Seat: ${data["Seat # 3"] || "N/A"}`, FIRST_ROW, startY + NINTH_COL);
      pdf.setFont("helvetica", "normal");

      const startCity3 = data["Guest Route Start City"] === "Vancouver" ? "Vancouver Train Station" : data["Guest Route Start City"] || "N/A";
      pdf.text(`From: ${startCity3}`, SECOND_ROW, startY + SEVENTH_COL);
      const thirdHotelStart = data["Pre-Rail Accommodation 3"] ? data["Pre-Rail Accommodation 3"] : "N/A";
      pdf.text(`Hotel: ${thirdHotelStart}`, SECOND_ROW, startY + EIGHTH_COL);
      const Transfer5 = data["Pre-Rail Transfer Pickup 5"] === "No Pre-Rail Transfer Pickup" ? "N/A" : data["Pre-Rail Transfer Pickup 5"] || "N/A";
      pdf.text(`Transfer: ${Transfer5}`, SECOND_ROW, startY + NINTH_COL);

      const endCity3 = data["Mgmt Leg 3"] === "Vancouver - Kamloops" ? "Kamloops Train Station" : data["Guest Route End City"] || "N/A";
      pdf.text(`To: ${endCity3}`, THIRD_ROW, startY + SEVENTH_COL);
      const thirdHotelEnd = data["Accommodation Item Name - Same Day 3"] ? data["Accommodation Item Name - Same Day 3"] : "N/A";
      pdf.text(`Hotel: ${thirdHotelEnd}`, THIRD_ROW, startY + EIGHTH_COL);
      const Transfer6 = data["Post-Rail Transfer Pickup 3"] === "No Post-Rail Transfer Pickup" ? "N/A" : data["Post-Rail Transfer Pickup 3"] || "N/A";
      pdf.text(`Transfer: ${Transfer6}`, THIRD_ROW, startY + NINTH_COL);

      pdf.setDrawColor(0);
      pdf.setLineWidth(1);
      pdf.rect(5, startY + 5, RECT_WIDTH, RECT_HEIGHT);

      startY += 170;
      entriesCurrentPage++;
    });
    pdf.save("ticket.pdf");
  };

  const { getRootProps, getInputProps, isDragActive } = useDropzone({ onDrop });

  return (
    <div className="min-h-screen bg-gray-50 text-gray-800">
      <header className="bg-blue-800 text-white py-4">
        <h1 className="text-3xl font-bold text-center">Rocky Mountain Ticket System</h1>
      </header>
      <div className="p-5 space-y-4">
        <div
          {...getRootProps()}
          className="cursor-pointer p-4 border-2 border-gray-300 border-dashed rounded hover:shadow-md hover:bg-gray-200 transition duration-300 ease-in-out flex justify-center items-center"
        >
          <input {...getInputProps()} />
          {isDragActive ? <p>Drop the file here...</p> : <p>Drag 'n' drop an Excel file here, or click to select a file</p>}
        </div>
        {isFileUploaded && <div className="text-green-500 text-sm mt-2">File uploaded: {fileName}</div>}
        <button
          variant="contained"
          className="bg-blue-500 hover:bg-blue-600 text-white font-bold py-2 px-4 rounded shadow-lg hover:shadow-xl transform hover:scale-105 transition duration-300 ease-in-out disabled:opacity-50 m-1"
          disabled={jsonToPrint.length === 0}
          onClick={() => downloadPDF(jsonToPrint)}
        >
          Download PDF
        </button>
      </div>
    </div>
  );
};

export default App;
