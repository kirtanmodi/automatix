import React, { useCallback, useState } from "react";
import { useDropzone } from "react-dropzone";
import * as XLSX from "xlsx";
import { jsPDF } from "jspdf";
import "jspdf-autotable";
import { format } from "date-fns";

const App = () => {
  const [jsonToPrint, setJsonToPrint] = useState([]);

  // Function to handle file drop
  const onDrop = useCallback((acceptedFiles) => {
    acceptedFiles.forEach((file) => {
      const reader = new FileReader();

      reader.onload = (event) => {
        try {
          // Reading file content
          const { result } = event.target;
          const workbook = XLSX.read(result, { type: "binary" });

          // Assume first worksheet is the target sheet
          const worksheetName = workbook.SheetNames[0];
          const worksheet = workbook.Sheets[worksheetName];

          // Convert sheet to JSON
          const data = XLSX.utils.sheet_to_json(worksheet, { header: 1 });
          if (data.length > 0) {
            const keys = data[0]; // First row as keys
            const jsonData = data.slice(1).map((row) => {
              let obj = {};
              row.forEach((value, index) => {
                obj[keys[index]] = value;
              });
              return obj;
            });

            // Convert JSON to PDF and download
            console.log(jsonData);
            setJsonToPrint(jsonData);
          }
        } catch (error) {
          console.error("Error reading the file:", error);
        }
      };

      reader.onerror = (error) => {
        console.error("Error reading the file:", error);
      };

      reader.readAsBinaryString(file);
    });
  }, []);

  // Function to download JSON data as PDF
  // const downloadPDF = (jsonData) => {
  //   const pdf = new jsPDF("l", "mm", "a4"); // landscape orientation
  //   pdf.autoTable({
  //     head: [Object.keys(jsonData[0])],
  //     body: jsonData.map((row) => Object.values(row).map(String)), // Convert all values to strings
  //     theme: "grid",
  //     styles: { cellWidth: "wrap" }, // use 'wrap' to avoid text overflow
  //     columnStyles: { text: { cellWidth: "auto" } }, // 'auto' will only use as much space as needed
  //     margin: { top: 10 },
  //     headStyles: { fillColor: [22, 160, 133] }, // Example of styling header color
  //     didDrawCell: (data) => {
  //       // If text is too long for cell, add ellipsis
  //       if (data.column.dataKey !== "id" && data.cell.raw != null && pdf.getStringUnitWidth(data.cell.raw) > data.cell.width - 2) {
  //         const text = data.cell.raw.substring(0, 30) + "..."; // Trim text
  //         pdf.text(text, data.cell.x + 2, data.cell.y + 10);
  //       }
  //     },
  //   });
  //   pdf.save("download.pdf");
  // };

  const downloadPDF = (jsonData) => {
    const pdf = new jsPDF({
      orientation: "landscape",
      unit: "pt",
      format: [288, 144], // Width and height of the ticket in points (4 x 2 inches)
    });

    jsonData.forEach((data, index) => {
      // Adjust starting Y position based on the number of tickets
      const startY = 10 + index * 144; // Height of one ticket is 144 points (2 inches)

      // Format date correctly
      const tripStartDate = new Date((data["Trip Start Date"] - (25567 + 2)) * 86400 * 1000);

      // Add guest name and trip details
      pdf.text(`Name: ${data["Guest Name"]}`, 10, startY + 20);
      pdf.text(`Date: ${format(tripStartDate, "dd/MM/yyyy")}`, 10, startY + 35);
      pdf.text(`From: ${data["Guest Route Start City"]} - To: ${data["Guest Route End City"]}`, 10, startY + 50);
      pdf.text(`Coach: ${data["Ord # 1"]} Seat: ${data["Seat # 1"]}`, 10, startY + 65);
      // ... more details as required ...

      // If this is not the first ticket, draw a separator line
      if (index > 0) {
        pdf.setDrawColor(0);
        pdf.setLineWidth(1);
        pdf.line(0, startY, 288, startY);
      }
    });

    pdf.save("ticket.pdf");
  };

  // Setup the dropzone
  const { getRootProps, getInputProps, isDragActive } = useDropzone({ onDrop });

  return (
    <div {...getRootProps()} style={{ border: "2px dashed #007bff", padding: "20px", textAlign: "center" }}>
      <input {...getInputProps()} />
      {isDragActive ? <p>Drop the file here...</p> : <p>Drag 'n' drop an Excel file here, or click to select a file</p>}
      <div>
        <button
          onClick={() => {
            downloadPDF(jsonToPrint);
          }}
        >
          Download PDF
        </button>
      </div>
    </div>
  );
};

export default App;
