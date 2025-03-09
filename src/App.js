import React, { useCallback, useState, useEffect } from "react";
import { useDropzone } from "react-dropzone";
import * as XLSX from "xlsx";
import { jsPDF } from "jspdf";
import "jspdf-autotable";
import { format } from "date-fns";
import moment from "moment";

import {
  Button,
  Paper,
  Typography,
  TextField,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Dialog,
  DialogActions,
  DialogContent,
  DialogContentText,
  DialogTitle,
  Select,
  MenuItem,
  InputLabel,
  FormControl,
  IconButton,
  Box,
  Grid,
  Chip,
  Badge,
  Divider,
  InputAdornment,
  Tooltip,
  Alert,
  Card,
  CardContent,
} from "@mui/material";

import {
  Search,
  Sort,
  CloudUpload,
  Print,
  LocalOffer,
  Close,
  PictureAsPdf,
  ArrowUpward,
  ArrowDownward,
  ContentCopy,
  PersonSearch,
  Luggage,
  Train,
} from "@mui/icons-material";

import styled from "@emotion/styled";

// Constants for PDF generation
const FIRST_ROW = 10;
const SECOND_ROW = 200;
const THIRD_ROW = 470;

const TITLE = 25;
const BOOKING_COL = TITLE + 25;

const FIRST_COL = BOOKING_COL + 16;
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

// Styled components
const DropzoneContainer = styled.div`
  border: 2px dashed #cccccc;
  border-radius: 12px;
  padding: 40px;
  text-align: center;
  background-color: #f8f8f8;
  cursor: pointer;
  transition: all 0.3s ease;
  margin-bottom: 20px;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  &:hover {
    border-color: #007aff;
    background-color: rgba(0, 122, 255, 0.05);
  }
`;

const HeaderContainer = styled.div`
  background: linear-gradient(135deg, #0071e3 0%, #42a5f5 100%);
  padding: 20px;
  color: white;
  border-radius: 8px 8px 0 0;
  box-shadow: 0 2px 10px rgba(0, 0, 0, 0.1);
`;

const StationChip = styled(Chip)`
  margin: 4px;
  font-weight: bold;
`;

const App = () => {
  // State variables
  const [jsonData, setJsonData] = useState([]);
  const [filteredData, setFilteredData] = useState([]);
  const [isFileUploaded, setIsFileUploaded] = useState(false);
  const [fileName, setFileName] = useState("");
  const [searchTerm, setSearchTerm] = useState("");
  const [sortConfig, setSortConfig] = useState({ key: null, direction: "ascending" });
  const [station, setStation] = useState("");
  const [selectedPassenger, setSelectedPassenger] = useState(null);
  const [openBoardingDialog, setOpenBoardingDialog] = useState(false);
  const [openLuggageDialog, setOpenLuggageDialog] = useState(false);
  const [luggageCount, setLuggageCount] = useState(0);
  const [passengerLuggageCounts, setPassengerLuggageCounts] = useState({});

  // Effect to filter data when search term or data changes
  useEffect(() => {
    if (jsonData.length === 0) {
      setFilteredData([]);
      return;
    }

    const lowercasedSearch = searchTerm.toLowerCase();
    const filtered = jsonData.filter(
      (passenger) =>
        passenger["Guest Name"]?.toLowerCase().includes(lowercasedSearch) || passenger["Booking #"]?.toLowerCase().includes(lowercasedSearch)
    );

    const sorted = [...filtered];
    if (sortConfig.key) {
      sorted.sort((a, b) => {
        if (a[sortConfig.key] === b[sortConfig.key]) return 0;
        if (a[sortConfig.key] === undefined || a[sortConfig.key] === null) return 1;
        if (b[sortConfig.key] === undefined || b[sortConfig.key] === null) return -1;

        const aValue = String(a[sortConfig.key]).toLowerCase();
        const bValue = String(b[sortConfig.key]).toLowerCase();

        if (sortConfig.direction === "ascending") {
          return aValue.localeCompare(bValue);
        } else {
          return bValue.localeCompare(aValue);
        }
      });
    }

    setFilteredData(sorted);
  }, [jsonData, searchTerm, sortConfig]);

  // Determine station based on start city
  useEffect(() => {
    if (jsonData.length > 0) {
      const startCity = jsonData[0]["Guest Route Start City"];
      if (startCity === "Vancouver") {
        setStation("Vancouver");
      } else if (startCity === "Kamloops") {
        setStation("Kamloops");
      } else if (startCity === "Jasper") {
        setStation("Jasper");
      } else {
        setStation("Unknown");
      }
    }
  }, [jsonData]);

  // File drop handler
  const onDrop = useCallback((acceptedFiles) => {
    acceptedFiles.forEach((file) => {
      setFileName(file.name);
      const fileExtension = file.name.split(".").pop().toLowerCase();

      if (fileExtension !== "xls" && fileExtension !== "xlsx" && fileExtension !== "csv") {
        alert("Please upload an Excel or CSV file.");
        return;
      }

      const reader = new FileReader();

      reader.onload = (event) => {
        try {
          const { result } = event.target;
          let data = [];

          // Handle CSV or Excel formats
          if (fileExtension === "csv") {
            const workbook = XLSX.read(result, { type: "binary" });
            const worksheetName = workbook.SheetNames[0];
            const worksheet = workbook.Sheets[worksheetName];
            data = XLSX.utils.sheet_to_json(worksheet, { header: 1 });
          } else {
            const workbook = XLSX.read(result, { type: "binary" });
            const worksheetName = workbook.SheetNames[0];
            const worksheet = workbook.Sheets[worksheetName];
            data = XLSX.utils.sheet_to_json(worksheet, { header: 1 });
          }

          if (data.length > 0) {
            const keys = data[1]; // The second row contains the headers in the sample file
            const jsonData = data.slice(2).map((row) => {
              let obj = {};
              row.forEach((value, index) => {
                if (keys[index]) {
                  obj[keys[index]] = value;
                }
              });
              return obj;
            });

            // Initialize luggage counts based on the data
            const initialLuggageCounts = {};
            jsonData.forEach((passenger) => {
              const midpointBags = passenger["#Midpoint Bags"] || 0;
              const straightThroughBags = passenger["# Straight Through Bags"] || 0;
              initialLuggageCounts[passenger["Guest Name"]] = {
                midpoint: parseInt(midpointBags) || 0,
                straightThrough: parseInt(straightThroughBags) || 0,
                total: (parseInt(midpointBags) || 0) + (parseInt(straightThroughBags) || 0),
              };
            });

            setJsonData(jsonData);
            setFilteredData(jsonData);
            setPassengerLuggageCounts(initialLuggageCounts);
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

  // Sort handler
  const requestSort = (key) => {
    let direction = "ascending";
    if (sortConfig.key === key && sortConfig.direction === "ascending") {
      direction = "descending";
    }
    setSortConfig({ key, direction });
  };

  // Dialog handlers
  const handleOpenBoardingDialog = (passenger) => {
    setSelectedPassenger(passenger);
    setOpenBoardingDialog(true);
  };

  const handleCloseBoardingDialog = () => {
    setOpenBoardingDialog(false);
  };

  const handleOpenLuggageDialog = (passenger) => {
    setSelectedPassenger(passenger);
    setLuggageCount(passengerLuggageCounts[passenger["Guest Name"]]?.total || 0);
    setOpenLuggageDialog(true);
  };

  const handleCloseLuggageDialog = () => {
    setOpenLuggageDialog(false);
  };

  const handleLuggageCountChange = (event) => {
    setLuggageCount(Number(event.target.value));
  };

  const saveLuggageCount = () => {
    if (selectedPassenger) {
      setPassengerLuggageCounts({
        ...passengerLuggageCounts,
        [selectedPassenger["Guest Name"]]: {
          ...passengerLuggageCounts[selectedPassenger["Guest Name"]],
          total: luggageCount,
        },
      });
      handleCloseLuggageDialog();
    }
  };

  // PDF generation for boarding pass
  const downloadBoardingPass = (passenger) => {
    const pdf = new jsPDF({
      orientation: "landscape",
      unit: "pt",
      format: "a4",
    });

    const startY = 20;

    const tripStartDate = passenger["Trip Start Date"];
    const formattedDate = tripStartDate ? moment(tripStartDate, "MM/DD/YYYY").format("Do MMMM YYYY") : "N/A";

    // Header information
    pdf.setFontSize(14);
    pdf.setFont("helvetica", "bold");
    pdf.text("Rocky Mountaineer", FIRST_ROW, startY + TITLE, { underline: true });
    pdf.setLineWidth(1);
    pdf.line(10, startY + TITLE + 5, 140, startY + TITLE + 5);
    pdf.setLineWidth(0);
    pdf.setFontSize(12);
    pdf.setFont("helvetica", "bold");
    pdf.text(`Booking #: ${passenger["Booking #"] || "N/A"}`, FIRST_ROW, startY + BOOKING_COL);
    pdf.setFont("helvetica", "normal");
    pdf.setFontSize(10);
    pdf.text(`Name: ${passenger["Guest Name"] || "N/A"}`, SECOND_ROW, startY + BOOKING_COL);
    pdf.text(`Date: ${formattedDate}`, THIRD_ROW, startY + BOOKING_COL);

    // Draw a horizontal line before the first section
    const distanceFromTop = startY + BOOKING_COL + 6;
    pdf.line(10, distanceFromTop, RECT_WIDTH - 10, distanceFromTop);

    // FIRST SECTION
    pdf.setFontSize(10);
    pdf.setFont("helvetica", "bold");
    pdf.text(`Service: ${passenger["Item Category 1"] || "N/A"}`, FIRST_ROW, startY + FIRST_COL);
    pdf.text(`Coach: ${passenger["Ord #"] || "N/A"}`, FIRST_ROW, startY + SECOND_COL);
    pdf.text(`Seat: ${passenger["Seat #"] || "N/A"}`, FIRST_ROW, startY + THIRD_COL);
    pdf.setFont("helvetica", "normal");

    const startCity = passenger["Guest Route Start City"] === "Vancouver" ? "Vancouver Train Station" : passenger["Guest Route Start City"] || "N/A";
    pdf.text(`From: ${startCity}`, SECOND_ROW, startY + FIRST_COL);
    const firstHotelStart = passenger["VAN Accomm"] || "N/A";
    pdf.text(`Hotel: ${firstHotelStart}`, SECOND_ROW, startY + SECOND_COL);
    const Transfer1 = passenger["VAN Transfer"] || "N/A";
    pdf.text(`Transfer: ${Transfer1}`, SECOND_ROW, startY + THIRD_COL);

    const endCity = passenger["Guest Route End City"] || "N/A";
    pdf.text(`To: ${endCity}`, THIRD_ROW, startY + FIRST_COL);
    const firstHotelEnd = passenger["KAM Accomm"] || "N/A";
    pdf.text(`Hotel: ${firstHotelEnd}`, THIRD_ROW, startY + SECOND_COL);
    const Transfer2 = passenger["Rockies Transfer"] || "N/A";
    pdf.text(`Transfer: ${Transfer2}`, THIRD_ROW, startY + THIRD_COL);

    // Draw box around the boarding pass
    pdf.setDrawColor(0);
    pdf.setLineWidth(1);
    pdf.rect(5, startY + 5, RECT_WIDTH, RECT_HEIGHT);

    // Add passenger information section
    pdf.setFontSize(10);
    pdf.setFont("helvetica", "bold");
    pdf.text("Additional Information:", FIRST_ROW, startY + RECT_HEIGHT + 20);
    pdf.setFont("helvetica", "normal");

    let additionalInfoY = startY + RECT_HEIGHT + 40;

    if (passenger["Personal Guest Information"]) {
      pdf.text(`Guest Info: ${passenger["Personal Guest Information"]}`, FIRST_ROW, additionalInfoY);
      additionalInfoY += 15;
    }

    if (passenger["Celebrations"]) {
      pdf.text(`Celebrations: ${passenger["Celebrations"]}`, FIRST_ROW, additionalInfoY);
      additionalInfoY += 15;
    }

    if (passenger["Notes"]) {
      pdf.text(`Notes: ${passenger["Notes"]}`, FIRST_ROW, additionalInfoY);
    }

    // Add luggage count information
    const luggageInfo = passengerLuggageCounts[passenger["Guest Name"]];
    if (luggageInfo) {
      pdf.setFont("helvetica", "bold");
      pdf.text(`Luggage Count: ${luggageInfo.total}`, THIRD_ROW, startY + RECT_HEIGHT + 20);
    }

    pdf.save(`boarding_pass_${passenger["Guest Name"].replace(/\s+/g, "_")}.pdf`);
  };

  // PDF generation for luggage tag
  const downloadLuggageTag = (passenger) => {
    const pdf = new jsPDF({
      orientation: "portrait",
      unit: "mm",
      format: "a6",
    });

    const luggageInfo = passengerLuggageCounts[passenger["Guest Name"]];
    const totalLuggage = luggageInfo?.total || 0;

    // Generate a tag for each piece of luggage
    for (let i = 0; i < totalLuggage; i++) {
      if (i > 0) {
        pdf.addPage();
      }

      // Add background color
      pdf.setFillColor(230, 230, 230);
      pdf.rect(0, 0, 105, 148, "F");

      // Add border
      pdf.setDrawColor(0);
      pdf.setLineWidth(0.5);
      pdf.rect(5, 5, 95, 138);

      // Header
      pdf.setFillColor(0, 113, 227); // Blue color
      pdf.rect(5, 5, 95, 15, "F");

      pdf.setTextColor(255);
      pdf.setFontSize(12);
      pdf.setFont("helvetica", "bold");
      pdf.text("ROCKY MOUNTAINEER", 52.5, 14, { align: "center" });

      pdf.setTextColor(0);
      pdf.setFontSize(10);
      pdf.setFont("helvetica", "bold");
      pdf.text("LUGGAGE TAG", 52.5, 25, { align: "center" });

      // Passenger information
      pdf.setFont("helvetica", "normal");
      pdf.text(`Name: ${passenger["Guest Name"]}`, 10, 35);
      pdf.text(`Booking #: ${passenger["Booking #"]}`, 10, 45);

      // Journey information
      pdf.setFont("helvetica", "bold");
      pdf.text("JOURNEY DETAILS", 52.5, 60, { align: "center" });

      pdf.setFont("helvetica", "normal");
      pdf.text(`From: ${passenger["Guest Route Start City"]}`, 10, 70);
      pdf.text(`To: ${passenger["Guest Route End City"]}`, 10, 80);
      pdf.text(`Coach: ${passenger["Ord #"]}`, 10, 90);
      pdf.text(`Seat: ${passenger["Seat #"]}`, 10, 100);

      // Tag number
      pdf.setFont("helvetica", "bold");
      pdf.text(`TAG ${i + 1} OF ${totalLuggage}`, 52.5, 115, { align: "center" });

      // Date
      const tripStartDate = passenger["Trip Start Date"];
      const formattedDate = tripStartDate ? moment(tripStartDate, "MM/DD/YYYY").format("MMMM D, YYYY") : "N/A";
      pdf.setFont("helvetica", "normal");
      pdf.text(`Date: ${formattedDate}`, 10, 130);
    }

    pdf.save(`luggage_tags_${passenger["Guest Name"].replace(/\s+/g, "_")}.pdf`);
  };

  const { getRootProps, getInputProps, isDragActive } = useDropzone({ onDrop });

  return (
    <Box sx={{ minHeight: "100vh", backgroundColor: "#f5f5f7", padding: 2 }}>
      <HeaderContainer>
        <Typography variant="h4" component="h1" gutterBottom sx={{ fontWeight: "bold", textAlign: "center" }}>
          Rocky Mountaineer Ticket System
        </Typography>
        {station && (
          <Box sx={{ display: "flex", justifyContent: "center", mt: 1 }}>
            <StationChip icon={<Train />} label={`Station: ${station}`} color="primary" variant="outlined" />
          </Box>
        )}
      </HeaderContainer>

      <Grid container spacing={3} sx={{ mt: 2 }}>
        <Grid item xs={12}>
          <Card elevation={2}>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Upload Passenger Data
              </Typography>
              <DropzoneContainer {...getRootProps()}>
                <input {...getInputProps()} />
                <CloudUpload fontSize="large" color="primary" />
                <Typography variant="body1" sx={{ mt: 2 }}>
                  {isDragActive ? "Drop the file here..." : "Drag & drop an Excel or CSV file here, or click to select"}
                </Typography>
                <Typography variant="body2" color="textSecondary" sx={{ mt: 1 }}>
                  Supported formats: .xlsx, .xls, .csv
                </Typography>
              </DropzoneContainer>
              {isFileUploaded && (
                <Alert severity="success" sx={{ mt: 2 }}>
                  File uploaded: {fileName}
                </Alert>
              )}
            </CardContent>
          </Card>
        </Grid>

        {isFileUploaded && (
          <>
            <Grid item xs={12}>
              <Card elevation={2}>
                <CardContent>
                  <Box sx={{ display: "flex", alignItems: "center", mb: 3 }}>
                    <TextField
                      fullWidth
                      variant="outlined"
                      label="Search by name or booking number"
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      InputProps={{
                        startAdornment: (
                          <InputAdornment position="start">
                            <Search />
                          </InputAdornment>
                        ),
                      }}
                    />
                  </Box>

                  <TableContainer component={Paper} sx={{ maxHeight: 400 }}>
                    <Table stickyHeader>
                      <TableHead>
                        <TableRow>
                          <TableCell>
                            <Box sx={{ display: "flex", alignItems: "center" }}>
                              <Typography variant="subtitle2">Guest Name</Typography>
                              <IconButton size="small" onClick={() => requestSort("Guest Name")}>
                                {sortConfig.key === "Guest Name" ? (
                                  sortConfig.direction === "ascending" ? (
                                    <ArrowUpward fontSize="small" />
                                  ) : (
                                    <ArrowDownward fontSize="small" />
                                  )
                                ) : (
                                  <Sort fontSize="small" />
                                )}
                              </IconButton>
                            </Box>
                          </TableCell>
                          <TableCell>
                            <Box sx={{ display: "flex", alignItems: "center" }}>
                              <Typography variant="subtitle2">Booking #</Typography>
                              <IconButton size="small" onClick={() => requestSort("Booking #")}>
                                {sortConfig.key === "Booking #" ? (
                                  sortConfig.direction === "ascending" ? (
                                    <ArrowUpward fontSize="small" />
                                  ) : (
                                    <ArrowDownward fontSize="small" />
                                  )
                                ) : (
                                  <Sort fontSize="small" />
                                )}
                              </IconButton>
                            </Box>
                          </TableCell>
                          <TableCell>
                            <Box sx={{ display: "flex", alignItems: "center" }}>
                              <Typography variant="subtitle2">Seat #</Typography>
                              <IconButton size="small" onClick={() => requestSort("Seat #")}>
                                {sortConfig.key === "Seat #" ? (
                                  sortConfig.direction === "ascending" ? (
                                    <ArrowUpward fontSize="small" />
                                  ) : (
                                    <ArrowDownward fontSize="small" />
                                  )
                                ) : (
                                  <Sort fontSize="small" />
                                )}
                              </IconButton>
                            </Box>
                          </TableCell>
                          <TableCell>
                            <Typography variant="subtitle2">Route</Typography>
                          </TableCell>
                          <TableCell>
                            <Typography variant="subtitle2">Luggage</Typography>
                          </TableCell>
                          <TableCell align="center">
                            <Typography variant="subtitle2">Actions</Typography>
                          </TableCell>
                        </TableRow>
                      </TableHead>
                      <TableBody>
                        {filteredData.map((passenger, index) => (
                          <TableRow key={index} hover>
                            <TableCell>{passenger["Guest Name"] || "N/A"}</TableCell>
                            <TableCell>{passenger["Booking #"] || "N/A"}</TableCell>
                            <TableCell>{passenger["Seat #"] || "N/A"}</TableCell>
                            <TableCell>
                              {passenger["Guest Route Start City"] || "N/A"} → {passenger["Guest Route End City"] || "N/A"}
                            </TableCell>
                            <TableCell>
                              <Badge badgeContent={passengerLuggageCounts[passenger["Guest Name"]]?.total || 0} color="primary" showZero>
                                <Luggage />
                              </Badge>
                            </TableCell>
                            <TableCell align="center">
                              <Box>
                                <Tooltip title="Print Boarding Pass">
                                  <IconButton color="primary" onClick={() => handleOpenBoardingDialog(passenger)}>
                                    <PictureAsPdf />
                                  </IconButton>
                                </Tooltip>
                                <Tooltip title="Print Luggage Tag">
                                  <IconButton color="secondary" onClick={() => handleOpenLuggageDialog(passenger)}>
                                    <LocalOffer />
                                  </IconButton>
                                </Tooltip>
                              </Box>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </TableContainer>
                </CardContent>
              </Card>
            </Grid>
          </>
        )}
      </Grid>

      {/* Boarding Pass Dialog */}
      <Dialog open={openBoardingDialog} onClose={handleCloseBoardingDialog} maxWidth="sm" fullWidth>
        <DialogTitle>
          <Box display="flex" alignItems="center" justifyContent="space-between">
            <Typography variant="h6">Print Boarding Pass</Typography>
            <IconButton edge="end" color="inherit" onClick={handleCloseBoardingDialog} aria-label="close">
              <Close />
            </IconButton>
          </Box>
        </DialogTitle>
        <DialogContent>
          {selectedPassenger && (
            <Box>
              <Typography variant="subtitle1" gutterBottom>
                <strong>Passenger:</strong> {selectedPassenger["Guest Name"]}
              </Typography>
              <Typography variant="body1" gutterBottom>
                <strong>Booking #:</strong> {selectedPassenger["Booking #"]}
              </Typography>
              <Typography variant="body1" gutterBottom>
                <strong>Seat #:</strong> {selectedPassenger["Seat #"]}
              </Typography>
              <Typography variant="body1" gutterBottom>
                <strong>Route:</strong> {selectedPassenger["Guest Route Start City"]} → {selectedPassenger["Guest Route End City"]}
              </Typography>

              <Divider sx={{ my: 2 }} />

              <Typography variant="body2" color="textSecondary">
                Click the button below to generate and download the boarding pass as a PDF.
              </Typography>
            </Box>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseBoardingDialog} color="inherit">
            Cancel
          </Button>
          <Button
            onClick={() => {
              if (selectedPassenger) {
                downloadBoardingPass(selectedPassenger);
                handleCloseBoardingDialog();
              }
            }}
            variant="contained"
            color="primary"
            startIcon={<PictureAsPdf />}
          >
            Generate Boarding Pass
          </Button>
        </DialogActions>
      </Dialog>

      {/* Luggage Tag Dialog */}
      <Dialog open={openLuggageDialog} onClose={handleCloseLuggageDialog} maxWidth="sm" fullWidth>
        <DialogTitle>
          <Box display="flex" alignItems="center" justifyContent="space-between">
            <Typography variant="h6">Luggage Tag Details</Typography>
            <IconButton edge="end" color="inherit" onClick={handleCloseLuggageDialog} aria-label="close">
              <Close />
            </IconButton>
          </Box>
        </DialogTitle>
        <DialogContent>
          {selectedPassenger && (
            <Box>
              <Typography variant="subtitle1" gutterBottom>
                <strong>Passenger:</strong> {selectedPassenger["Guest Name"]}
              </Typography>

              <Box sx={{ mt: 3 }}>
                <FormControl fullWidth variant="outlined">
                  <InputLabel id="luggage-count-label">How many luggage items?</InputLabel>
                  <Select labelId="luggage-count-label" value={luggageCount} onChange={handleLuggageCountChange} label="How many luggage items?">
                    {[0, 1, 2, 3, 4, 5, 6].map((num) => (
                      <MenuItem key={num} value={num}>
                        {num}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Box>

              <Divider sx={{ my: 3 }} />

              <Typography variant="body2" color="textSecondary">
                First update the luggage count, then generate the luggage tags as a PDF. One tag will be generated for each piece of luggage.
              </Typography>
            </Box>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseLuggageDialog} color="inherit">
            Cancel
          </Button>
          <Button onClick={saveLuggageCount} variant="outlined" color="primary">
            Update Count
          </Button>
          <Button
            onClick={() => {
              if (selectedPassenger) {
                downloadLuggageTag(selectedPassenger);
                handleCloseLuggageDialog();
              }
            }}
            variant="contained"
            color="secondary"
            startIcon={<LocalOffer />}
            disabled={luggageCount <= 0}
          >
            Generate Tags
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default App;
