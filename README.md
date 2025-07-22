# ViitGEE

**ViitGEE (Visual Image Interpretation Tool for Google Earth Engine)** is an open-source application developed by Dr. Emre Akturk to assist in visual land cover interpretation using very high resolution (VHR) imagery within the Google Earth Engine (GEE) environment.

Version: **1.0**  
License: **MIT License**  
Access Tool: [https://tinyurl.com/viitgee](https://tinyurl.com/viitgee)
             [https://code.earthengine.google.com/644f27ea3b6043a9000ba8af36992cde](https://code.earthengine.google.com/644f27ea3b6043a9000ba8af36992cde)

---

## 🔍 Overview

ViitGEE provides researchers, educators, and students with a flexible interface to:
- Upload point-based shapefiles
- Define custom spatial buffers
- Generate 5x5 interpretation grids
- Visually classify land cover using CORINE Level-2 and Level-3 categories or modify land cover classes based on your study needs
- View NDVI time series from MODIS (2014–2024)
- Export results in CSV or GeoJSON formats

It enables the creation of reliable training and validation datasets for land cover classification, especially when field data is limited or unavailable.

---

## 🚀 Key Features

- 🔗 Google Earth Engine integration  
- 🛰️ High-resolution image access via Google Maps infrastructure  
- 🌱 NDVI time-series chart for temporal vegetation analysis  
- 📦 Export options: CSV and GeoJSON  
- 🔧 Customizable land cover classification list  
- 💻 No local installation required

---

## 📁 How to Use

1. Open the tool in GEE: [ViitGEE GEE Script](https://code.earthengine.google.com/0c3727d519c490ceb1a0a30421abb40f)
2. Upload your shapefile as a Table asset
3. Provide the asset path and select:
   - Attribute ID
   - Buffer size (in meters)
4. Select a point, interpret the land cover, and view NDVI charts
5. Save your classification
6. Export results when done

---

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE.txt) file for details.

---

## 👤 Author

Developed and maintained by **Dr. Emre Akturk**  
Department of Forest Engineering  
Kastamonu University, Türkiye  
ORCID: [0000-0003-0953-4749](https://orcid.org/0000-0003-0953-4749)

---

## 📣 Citation

If you use ViitGEE in your research, please cite the corresponding article and acknowledge the tool as follows:

> Akturk, E. (2025). ViitGEE: An Open-Source Tool for Visual Image Interpretation and Reference Data Collection in Google Earth Engine. (In review).

