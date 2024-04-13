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
      format: [288, 144],
    });

    jsonData.forEach((data, index) => {
      const startY = 10 + index * 144;

      pdf.setFont("helvetica");
      pdf.setFontSize(10);

      const tripStartDate = new Date((data["Trip Start Date"] - (25567 + 2)) * 86400 * 1000);

      pdf.text(`Name: ${data["Guest Name"]}`, 10, startY + 20);
      pdf.text(`Date: ${format(tripStartDate, "dd/MM/yyyy")}`, 10, startY + 35);
      pdf.text(`From: ${data["Guest Route Start City"]} - To: ${data["Guest Route End City"]}`, 10, startY + 50);
      pdf.text(`Coach: ${data["Ord # 1"]} Seat: ${data["Seat # 1"]}`, 10, startY + 65);

      pdf.setDrawColor(0);
      pdf.setLineWidth(1);
      pdf.rect(5, startY + 5, 278, 75);

      if (index > 0) {
        pdf.setDrawColor(0);
        pdf.setLineWidth(1);
        pdf.line(0, startY, 288, startY);
      }
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
