import React, { useCallback } from "react";
import { useDropzone } from "react-dropzone";
import * as XLSX from "xlsx";
import PdfPrinter from "pdfmake/build/pdfmake";
import vfsFonts from "pdfmake/build/vfs_fonts";

const App = () => {
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

            console.log(jsonData);
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

  // Setup the dropzone
  const { getRootProps, getInputProps, isDragActive } = useDropzone({ onDrop });

  const createPdf = (data) => {
    try {
      const { vfs } = vfsFonts.pdfMake;
      PdfPrinter.vfs = vfs;

      const documentDefinition = {
        content: [
          {
            table: {
              headerRows: 1,
              widths: "*",
              body: buildTableBody(data),
            },
            layout: "lightHorizontalLines",
          },
        ],
      };

      const pdfDocGenerator = PdfPrinter.createPdf(documentDefinition);
      pdfDocGenerator.download("trip-details.pdf");
    } catch (error) {
      console.error("Failed to create PDF:", error);
    }
  };

  const buildTableBody = (data) => {
    const headers = Object.keys(data[0]).map((key) => ({ text: key, style: "tableHeader" }));
    const body = data.map((record) => Object.values(record).map((value) => value.toString()));
    return [headers, ...body];
  };

  return (
    <div {...getRootProps()} style={{ border: "2px dashed #007bff", padding: "20px", textAlign: "center" }}>
      <input {...getInputProps()} />
      {isDragActive ? <p>Drop the file here ...</p> : <p>Drag 'n' drop an Excel file here, or click to select a file</p>}
    </div>
  );
};

export default App;
