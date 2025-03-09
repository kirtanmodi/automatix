# Rocky Mountaineer Ticket System

A modern web application for managing train passenger data, printing boarding passes, and generating luggage tags for the Rocky Mountaineer train service.

## Features

- **File Upload**: Supports Excel (.xlsx, .xls) and CSV file formats with passenger data
- **Station Detection**: Automatically identifies the station based on departure city
- **Search Functionality**: Search passengers by name or booking number
- **Sorting**: Sort passenger data by name, booking number, or seat number
- **Boarding Pass Generation**: Create and print boarding passes as PDF
- **Luggage Tag System**: Manage luggage counts and generate printable luggage tags
- **Responsive Design**: Works on both desktop and mobile devices

## Usage Instructions

1. **Upload Passenger Data**: 
   - Drag and drop an Excel or CSV file with passenger information
   - The system will automatically detect the station based on the departure city

2. **Search and Sort**:
   - Use the search bar to find passengers by name or booking number
   - Click on the column headers to sort by name, booking number, or seat

3. **Generate Boarding Passes**:
   - Click the PDF icon next to a passenger to open the boarding pass dialog
   - Review passenger details and click "Generate Boarding Pass"
   - The PDF will be downloaded to your device

4. **Manage Luggage Tags**:
   - Click the luggage tag icon next to a passenger
   - Enter the number of luggage items for that passenger
   - Click "Update Count" to save the luggage count
   - Click "Generate Tags" to create a PDF with individual luggage tags
   - Each passenger will receive one tag per luggage item

## File Format Requirements

The system expects a CSV or Excel file with the following columns:
- Trip Start Date
- Guest Name
- Booking #
- Guest Route Start City
- Guest Route End City
- #Midpoint Bags
- # Straight Through Bags
- Ord # (Coach number)
- Seat #
- VAN Accomm (Vancouver Accommodation)
- VAN Transfer
- KAM Accomm (Kamloops Accommodation)
- Rockies Accomm
- Rockies Transfer
- Circle Journey
- Personal Guest Information
- Celebrations
- Notes

## Development

This project was built with:
- React
- Material-UI
- jsPDF for PDF generation
- XLSX for spreadsheet parsing

### Available Scripts

- `npm start` - Run the development server
- `npm build` - Build the app for production
- `npm test` - Run tests
- `npm run deploy` - Deploy to GitHub Pages
