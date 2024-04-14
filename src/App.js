import React, { useCallback, useState } from "react";
import { useDropzone } from "react-dropzone";
import * as XLSX from "xlsx";
import { jsPDF } from "jspdf";
import "jspdf-autotable";
import { format } from "date-fns";

const App = () => {
  const [jsonToPrint, setJsonToPrint] = useState([]);

  const onDrop = useCallback((acceptedFiles) => {
    acceptedFiles.forEach((file) => {
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

  const downloadPDF = (jsonData) => {
    const pdf = new jsPDF({
      orientation: "landscape",
      unit: "pt",
      format: "a4",
    });

    let entriesPerPage = 4;
    let entriesCurrentPage = 0;
    let startY = 20;

    jsonData.forEach((data, index) => {
      if (entriesCurrentPage >= entriesPerPage) {
        pdf.addPage();
        entriesCurrentPage = 0; // Reset counter
        startY = 20; // Reset startY for new page
      }

      pdf.setFont("helvetica");
      pdf.setFontSize(10);

      const tripStartDate = new Date((data["Trip Start Date"] - (25567 + 2)) * 86400 * 1000);
      const formattedDate = format(tripStartDate, "dd/MM/yyyy");

      // Header information
      pdf.text(`Name: ${data["Guest Name"]}`, 10, startY + 20);
      pdf.text(`Date: ${formattedDate}`, 10, startY + 40);

      // Detailed service information --- should be in one column
      pdf.text(`Service: ${data["Item Category 1"]}`, 10, startY + 60);
      pdf.text(`Coach: ${data["Ord # 1"]}`, 150, startY + 60);
      pdf.text(`Seat: ${data["Seat # 1"]}`, 300, startY + 60);

      // Route information
      pdf.text(`From: ${data["Guest Route Start City"]}`, 10, startY + 80);
      pdf.text(`To: ${data["Guest Route End City"]}`, 150, startY + 80);

      // Accommodation information (if available)
      const hotelInfo = data["Pre-Rail Accommodation 2"] ? `Hotel: ${data["Pre-Rail Accommodation 2"]}` : "";
      pdf.text(hotelInfo, 300, startY + 80);

      // Draw box around the ticket info
      pdf.setDrawColor(0);
      pdf.setLineWidth(1);
      pdf.rect(5, startY + 5, 580, 100); // Adjust the box size

      startY += 120; // Increase startY for next entry
      entriesCurrentPage++; // Increment the counter
    });

    pdf.save("ticket.pdf");
  };

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
