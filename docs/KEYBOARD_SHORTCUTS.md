# Keyboard Shortcuts Guide

This document lists all active keyboard shortcuts, key combinations, and system-level hotkey behaviors configured in the Autonoma ERP (BOS Portal) application.

---

## 1. Global Portal-Wide Shortcuts (Space + Key)
These shortcuts are triggered by holding down the **Spacebar** and then pressing the target key. They are active globally across the application (except when actively typing inside text inputs, textareas, selects, or editable fields).

| Key Combination | Action | Triggers |
| :--- | :--- | :--- |
| **`Space` + `N`** | **New / Add / Create** | Clicks "+ New", "+ Add", "+ Create", or "+ New" buttons |
| **`Space` + `S`** | **Save / Submit** | Clicks "Save", "Submit", "Update", "Confirm", or "Save changes" |
| **`Space` + `C`** | **Close / Cancel** | Clicks "Close" or "Cancel" |
| **`Space` + `E`** | **Export / Download** | Clicks "Export", "Download", "Excel", or "CSV" |
| **`Space` + `F`** | **Filter / Search** | Activates or focuses search filters |
| **`Space` + `B`** | **Back / Return** | Clicks "Back", "Return", or "Go back" |
| **`Space` + `V`** | **Verify / Accept / Approve** | Clicks "Verify", "Verified", "Accept", or "Approve" |
| **`Space` + `R`** | **Reject** | Clicks "Reject" or "Disapprove" |
| **`Space` + `A`** | **Amend / Amendment** | Clicks "Amendment" or "Amend" |
| **`Space` + `Shift` + `A`** | **Assign** | Clicks "Assign" |
| **`Space` + `H`** | **Home** | Navigates back to the User Task Queue Dashboard |
| **`Space` + `L`** | **Logout** | Clicks the logout button/item |
| **`Space` + `Ctrl` + `A`** | **Toggle Aura AI** | Toggles the Aura Voice/AI assistant panel |
| **`Space` + `Ctrl` + `F`** | **Toggle Fullscreen** | Enters or exits browser fullscreen mode |
| **`Space` + `Shift` + `N`** | **Notifications** | Toggles the notifications panel |
| **`Space` + `Shift` + `S`** | **Settings** | Toggles the live customization settings panel |

---

## 2. Dialog / Form Popup Shortcuts (BOSFormDialog)
These shortcuts apply specifically when a dialog or form popup (`BOSFormDialog`) is open and focused:

| Key Combination | Action | Triggers |
| :--- | :--- | :--- |
| **`Ctrl` + `S`** (or `s`) | **Save** | Submits form data |
| **`Ctrl` + `E`** (or `e`) | **Edit** | Switches a view-only form into edit mode |
| **`Ctrl` + `D`** (or `d`) | **Delete** | Deletes the active record |
| **`Escape`** | **Close / Cancel** | Closes the active dialog |

---

## 3. Deletion Confirmation Dialog Shortcuts (ConfirmDeleteDialog)
These apply when a confirmation dialog pop-up is shown:

| Key Combination | Action | Triggers |
| :--- | :--- | :--- |
| **`Ctrl` + `Y`** | **Yes** | Confirms deletion |
| **`Ctrl` + `N`** | **No** | Cancels/closes the dialog |
| **`Escape`** | **No** | Cancels/closes the dialog |

---

## 4. File Preview Navigation (BOSFilePreview)
When previewing multi-page documents or a collection of files:

| Key | Action | Triggers |
| :--- | :--- | :--- |
| **`ArrowLeft`** | **Previous Document / Page** | Slides to the previous file/page |
| **`ArrowRight`** | **Next Document / Page** | Slides to the next file/page |

---

## 5. Layout, Navigation, and Greeting Panels
* **`Alt`** (on the Main Layout): **Toggle Horizontal Navigation Bar** (shows/focuses horizontal navigation menus)
* **`Escape`** (on the Horizontal Bar): **Close sub-menus / Clear focus**
* **`Escape`** (on Birthday / Special Day Popups): **Close Popup**

---

## 6. Security Restrictive Hotkeys (For Non-Superusers)
To protect data security and prevent unauthorized inspection, the following hotkeys are intercepted and **blocked** for normal users:

* **`PrintScreen`**: **Blocked** (prevents screen capture/prints)
* **`Ctrl` + `P`**: **Blocked** (prevents printing the page)
* **`F12`**: **Blocked** (prevents opening browser DevTools)
* **`Ctrl` + `Shift` + `I`** / **`Ctrl` + `Shift` + `C`**: **Blocked** (prevents opening browser DevTools)

---

## 7. Explicitly Blocked Legacy Hotkeys
The following hotkey combinations are explicitly **blocked** globally to prevent conflicts with the standard global `Space + Key` commands:
* `Ctrl` + `N` / `Alt` + `N`
* `Alt` + `S`
* `Alt` + `E`
* `Ctrl` + `D` / `Alt` + `D`
* `Ctrl` + `A` / `Alt` + `A`
* `Ctrl` + `F` / `Alt` + `F`
