# HiddenSortGrid

**Switchable readonly/editable PCF OOB-like subgrid with optional sorting, filters, and support for hidden and locked columns.**

---

## 🧩 Overview

HiddenSortGrid is a **custom PCF control** for Dynamics 365 / Power Apps model-driven apps that extends the functionality of the standard OOB subgrid.

It was built to provide makers with more flexibility in displaying related records while maintaining the familiar user experience of the native subgrid.

For example, it’s ideal when you need to display sorted ranges — such as shoe or clothing sizes — where sorting relies on a technical field that you don’t want users to see.

No additional dependencies. 100% client-side.

---

## ✨ Features

- 🟡 **Hide the sorting column** — the primary feature that removes the technical sort column for cleaner UI.  
- 🟢 **Readonly / Editable switchable mode** — toggle between view and edit directly in the same grid.  
- 🔵 **Enable / Disable filtering** — control whether users can apply quick filters.  
- 🟣 **Enable / Disable sorting** — lock sorting completely if desired.  
- 🟠 **Allow / Disallow row selection** — prevent accidental record selection in readonly mode.  
- 🟤 **Lock specific columns** — in editable mode, choose which columns remain non-editable by default.  
- 🔗 **Show “Open record” column** — adds an extra column with an “open in new tab” action for each row (optional).  

---

## ⚙️ Configuration

| Property | Description |
|-----------|-------------|
| **Hide Sorting Column** | Hides the sorting header/column from the grid UI. Default: enabled. |
| **Readonly/Editable** | Switch between display modes. Default: disabled. |
| **Enable Filters** | Allows quick filtering in the grid. Default: enabled. |
| **Enable Sorting** | Enables or disables sorting per column. Default: enabled. |
| **Allow Row Selection** | Determines if rows can be selected. Default: enabled. |
| **Locked Columns** | Comma-separated list of columns locked in editable mode. Default: empty. |
| **Show Open Record Column** | Adds an action column that opens the record (new tab). Default: disabled. |

---

## 🚀 Installation

1. Import the managed solution (`Bendi.HiddenSortGrid`) into your environment.  
2. Add the **HiddenSortGrid** control to a subgrid on your form.  
3. Configure the desired properties (see table above).  
4. Publish and enjoy your cleaner, more flexible subgrid experience.

---

## 📦 Solution Info

| Item | Value |
|------|-------|
| **Solution name** | `Bendi.HiddenSortGrid` |
| **Publisher** | Bendi – DynamiX |
| **Prefix** | `bndi` |
| **Version** | `1.0.0.0` |
| **License** | [MIT](LICENSE) |

---

## 🧠 Notes

- Designed for **model-driven apps** (OOB subgrid replacement).  
- Fully compatible with **Dataverse** and standard PCF deployment.  
- Tested with the latest Dynamics 365 and Power Apps environments.  

---

## 🧩 Known Limitations / Future Enhancements

- 🔸 **Lookup fields** are currently readonly in editable mode.  
- 🔸 **Multiselect OptionSets** are not yet editable.  
- 🔸 **Virtualization / incremental loading** is not implemented yet.  

These features are planned for future updates once the core functionality is fully stabilized.

---

## 🧑‍💻 Author

**Martin Beno**  
Bendi – DynamiX  
[LinkedIn](https://www.linkedin.com/in/martin-beno-dynamics365-ce)  
[GitHub Profile](https://github.com/bendi-dynamix)

---

## 🪪 License

Released under the [MIT License](LICENSE).
