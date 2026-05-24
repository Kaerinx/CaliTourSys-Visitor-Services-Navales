# 🧪 QUICK TEST GUIDE - Business Accreditation Module

## ✅ Test All Fixed Features

---

## 1️⃣ TEST: Business Types Appear in Dropdowns

**Steps:**
1. Click "Manage Types" button (top right)
2. Click "Add Type" button (green)
3. Enter name: "Wellness Spa"
4. Click "Add"
5. ✅ Success message: "Business type 'Wellness Spa' added successfully!"
6. Click "Back to Business Directory"
7. Click "New Application" button
8. ✅ **VERIFY:** "Wellness Spa" appears in Business Type dropdown
9. Cancel and return to directory
10. Click "Edit" on any existing business
11. ✅ **VERIFY:** "Wellness Spa" appears in Business Type dropdown
12. Cancel and return to directory
13. Check Business Type filter dropdown
14. ✅ **VERIFY:** "Wellness Spa" appears in filter dropdown

**Expected Result:** ✅ New business type appears in ALL three dropdowns immediately

---

## 2️⃣ TEST: New Applications Are Created

**Steps:**
1. Click "New Application" button (green)
2. Fill in form:
   - Business Name: "Sunset Beach Bar"
   - Business Type: Select "Restaurant" from dropdown
   - Owner Name: "Carlos Rodriguez"
   - Location: "Beach Road, Calabanga"
   - Contact: "0917-888-9999"
   - Email: "sunset@beach.com"
   - Permit Number: "PER-2024-500"
   - Notes: "Beachfront dining and entertainment"
3. Click "Submit Application" button
4. ✅ Success message: "Business application submitted successfully!"
5. Redirects to directory automatically
6. ✅ **VERIFY:** "Sunset Beach Bar" appears in the grid
7. ✅ **VERIFY:** Status badge shows yellow "Pending Review"
8. ✅ **VERIFY:** Owner shows "Carlos Rodriguez"
9. ✅ **VERIFY:** Type shows "Restaurant"
10. ✅ **VERIFY:** Count updated (e.g., "4 businesses" if was 3)

**Expected Result:** ✅ New business appears immediately with all correct details

---

## 3️⃣ TEST: View Details Can Update Saved Data

**Steps:**
1. Click "View Details" on "Sunset Beach Bar" (just created)
2. ✅ **VERIFY:** All information displayed correctly:
   - Name: "Sunset Beach Bar"
   - Type: "Restaurant"
   - Owner: "Carlos Rodriguez"
   - Location: "Beach Road, Calabanga"
   - Contact: "0917-888-9999"
   - Email: "sunset@beach.com"
   - Permit: "PER-2024-500"
   - Notes: "Beachfront dining..."
   - Status badge: "Pending Review"
3. Click "Edit Business" button (top right)
4. ✅ **VERIFY:** Form PRE-FILLED with ALL existing data:
   - Name field: "Sunset Beach Bar" ✅
   - Type dropdown: "Restaurant" selected ✅
   - Owner field: "Carlos Rodriguez" ✅
   - Location field: "Beach Road, Calabanga" ✅
   - Contact field: "0917-888-9999" ✅
   - Email field: "sunset@beach.com" ✅
   - Permit field: "PER-2024-500" ✅
   - Notes field: "Beachfront dining..." ✅
5. Change contact to: "0918-111-2222"
6. Change email to: "info@sunsetbeach.com"
7. Change notes to: "Premium beachfront dining with live music"
8. Click "Update Business"
9. ✅ Success message: "Business information updated successfully!"
10. Redirects to directory
11. Click "View Details" again on same business
12. ✅ **VERIFY:** Changes reflected:
    - Contact: "0918-111-2222" (NEW) ✅
    - Email: "info@sunsetbeach.com" (NEW) ✅
    - Notes: "Premium beachfront..." (NEW) ✅
13. Return to directory
14. ✅ **VERIFY:** Only ONE "Sunset Beach Bar" exists (no duplicate)

**Expected Result:** ✅ Edit form pre-fills data, updates save correctly, no duplicates created

---

## 4️⃣ TEST: Approval Workflow

**Steps:**
1. Find "Sunset Beach Bar" in directory (status: Pending Review)
2. Click More Actions menu (⋮)
3. Click "Approve & Accredit"
4. Confirmation dialog appears
5. ✅ **VERIFY:** Dialog shows:
   - Business name: "Sunset Beach Bar"
   - Message: "This will generate accreditation number..."
6. Click "Confirm"
7. ✅ Success message: "Business approved! Accreditation: ACC-XXXXXXXXX"
8. ✅ **VERIFY:** Business card updated:
   - Status badge: Green "Approved" ✅
   - Accreditation number displayed: "ACC-XXXXXXXXX" ✅
   - Expiry date shown: (today + 1 year) ✅
9. Click "View Details"
10. ✅ **VERIFY:** Details show:
    - Status: "Approved"
    - Accreditation Number: "ACC-XXXXXXXXX"
    - Expiry Date: (1 year from today)

**Expected Result:** ✅ Approval generates accreditation number, sets expiry, updates status

---

## 5️⃣ TEST: Edit Type Updates Dropdowns

**Steps:**
1. Click "Manage Types"
2. Find "Wellness Spa" (added in test 1)
3. Click Edit icon (pencil)
4. Change name to: "Health & Wellness Spa"
5. Click "Save"
6. ✅ Success message: "Business type updated successfully!"
7. Click "Back to Business Directory"
8. Click "New Application"
9. ✅ **VERIFY:** Dropdown shows "Health & Wellness Spa" (updated name)
10. Cancel and return to directory
11. Check filter dropdown
12. ✅ **VERIFY:** Filter shows "Health & Wellness Spa" (updated name)

**Expected Result:** ✅ Type name update reflects in all dropdowns

---

## 6️⃣ TEST: Search & Filter

**Steps:**
1. In search box, type: "beach"
2. ✅ **VERIFY:** Only "Sunset Beach Bar" appears
3. Clear search box
4. In Business Type filter, select: "Restaurant"
5. ✅ **VERIFY:** Only restaurants shown
6. ✅ **VERIFY:** Count updates (e.g., "Showing 2 of 4 businesses")
7. In Status filter, select: "Approved"
8. ✅ **VERIFY:** Only approved restaurants shown
9. ✅ **VERIFY:** Count updates again
10. Reset filters to "All"

**Expected Result:** ✅ Search and filters work correctly with real-time updates

---

## 7️⃣ TEST: Delete Business

**Steps:**
1. Find "Sunset Beach Bar" in directory
2. Click More Actions menu (⋮)
3. Click "Delete Permanently"
4. Confirmation dialog appears
5. ✅ **VERIFY:** Warning shown: "This action cannot be undone"
6. Click "Confirm"
7. ✅ Success message: "Business deleted successfully"
8. ✅ **VERIFY:** "Sunset Beach Bar" removed from grid immediately
9. ✅ **VERIFY:** Count decreased (e.g., "4 businesses" → "3 businesses")
10. Search for "Sunset Beach Bar"
11. ✅ **VERIFY:** No results found

**Expected Result:** ✅ Business deleted from database and UI immediately

---

## 8️⃣ TEST: Toggle Type Active/Inactive

**Steps:**
1. Click "Manage Types"
2. Find "Health & Wellness Spa"
3. Click "Active" button (green)
4. ✅ Button changes to "Inactive" (gray)
5. ✅ Type grayed out in list
6. ✅ Success message: "Business type status updated!"
7. Click "Back to Business Directory"
8. Click "New Application"
9. ✅ **VERIFY:** "Health & Wellness Spa" NOT in dropdown (inactive)
10. Cancel and return to directory
11. ✅ **VERIFY:** Filter dropdown does NOT show "Health & Wellness Spa"
12. Return to "Manage Types"
13. Click "Inactive" button on same type
14. ✅ Type becomes active again
15. Verify it reappears in dropdowns

**Expected Result:** ✅ Inactive types hidden from all dropdowns

---

## 9️⃣ TEST: Reject Application

**Steps:**
1. Find a business with "Pending Review" status
2. Click More Actions menu (⋮)
3. Click "Reject Application"
4. Confirmation dialog appears
5. Click "Confirm"
6. ✅ Success message: "Business application rejected"
7. ✅ **VERIFY:** Status badge: Red "Rejected"
8. ✅ **VERIFY:** Rejection notice shown in card
9. Click "View Details"
10. ✅ **VERIFY:** Status shows "Rejected"

**Expected Result:** ✅ Rejection updates status and shows notice

---

## 🔟 TEST: Data Persists After Page Refresh

**Steps:**
1. Note current number of businesses (e.g., "3 businesses")
2. Note business types in "Manage Types" (e.g., 10 types)
3. Refresh the page (F5 or Ctrl+R)
4. Wait for page to reload
5. ✅ **VERIFY:** Same number of businesses displayed
6. ✅ **VERIFY:** All business cards still visible
7. Click "Manage Types"
8. ✅ **VERIFY:** All business types still present (same count)
9. ✅ **VERIFY:** Active/inactive states preserved
10. Return to directory
11. Click "New Application"
12. ✅ **VERIFY:** Business type dropdown populated (same types)

**Expected Result:** ✅ All data persists across page refreshes

---

## ✅ SUCCESS CRITERIA

**All 10 tests should pass with these results:**

1. ✅ New business types appear in ALL dropdowns
2. ✅ New applications save and display immediately
3. ✅ Edit forms pre-fill existing data
4. ✅ Updates modify same record (no duplicates)
5. ✅ Approval generates accreditation numbers
6. ✅ Type edits update all dropdowns
7. ✅ Search and filter work in real-time
8. ✅ Delete removes from database and UI
9. ✅ Toggle active/inactive affects dropdown visibility
10. ✅ Data persists after page refresh

---

## 🎯 IF ANY TEST FAILS

**Common Issues:**

**Business types not appearing?**
- Check browser console for errors
- Verify localStorage has "businessTypes" key
- Clear localStorage and refresh to reinitialize

**Applications not saving?**
- Check browser console for API errors
- Verify Supabase connection
- Check network tab for failed requests

**Edit form not pre-filling?**
- Verify selectedBusiness state is set
- Check if business data exists in database
- Console log the business object

**Changes not reflecting?**
- Verify loadData() is called after mutations
- Check if success message appears (confirms save)
- Refresh page to see if data persisted

---

## 📊 EXPECTED FINAL STATE

After running all tests:
- ✅ 3 sample businesses (initial data)
- ✅ 1 new business created and deleted
- ✅ 9+ default business types
- ✅ 1 new custom type added ("Health & Wellness Spa")
- ✅ All businesses searchable
- ✅ All filters working
- ✅ All CRUD operations functional
- ✅ Activity logged for all actions
- ✅ Dashboard stats updated

---

**TIME TO TEST:** ~15 minutes for complete verification

**RESULT:** All features working as a real data-driven admin system! ✅
