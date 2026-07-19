// function calculate_tat(start_time, end_time) {
//     if (!start_time || !end_time) return null;
//     try {
//         const startDate = new Date(start_time);
//         const endDate = new Date(end_time);
//         const diffMs = endDate - startDate;
//         const totalSeconds = Math.floor(diffMs / 1000);
//         const hours = Math.floor(totalSeconds / 3600);
//         const minutes = Math.floor((totalSeconds % 3600) / 60);
//         const seconds = totalSeconds % 60;
//         return `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
//     } catch (err) {
//         console.error("Error calculating TAT:", err);
//         return null;
//     }
// }
// // Helper functions for item parsing and safe batch resolution

// function parse_component_string(component_string) {
//     let items = [];
//     (component_string || "")
//         .split(",")
//         .map(s => s.trim())
//         .filter(Boolean)
//         .forEach(entry => {
//             let qty = 1;
//             let item_code = entry;

//             let m = entry.match(/\[Qty:(\d+)\]$/);
//             if (m) {
//                 qty = parseInt(m[1]);
//                 item_code = entry.replace(/\s*\[Qty:\d+\]$/, '').trim();
//             }

//             items.push({
//                 item_code: item_code,
//                 qty: qty
//             });
//         });

//     return items;
// }

// // Robust batch lookup using get_items_by_partial_name to prevent DoesNotExist errors
// async function get_item_docs_by_codes(item_codes) {
//     if (!item_codes || item_codes.length === 0) return [];
//     try {
//         let res = await frappe.call({
//             method: "rms.rms.doctype.repair_and_return_technician_view.repair_and_return_technician_view.get_items_by_partial_name",
//             args: { item_names: item_codes }
//         });
//         return res.message || [];
//     } catch (e) {
//         console.error("Item batch fetch failed:", e);
//         return [];
//     }
// }

// // Deduplication Helper: Safely appends remarks avoiding repeated entries
// function safe_add_remark(doc, repair_remarks) {
//     if (!repair_remarks || !repair_remarks.trim()) return false;
//     let normalized_new = repair_remarks.trim();
//     let last_remark = "";
//     if (doc.remarks && doc.remarks.length > 0) {
//         last_remark = (doc.remarks[doc.remarks.length - 1].repair_remarks || "").trim();
//     } else {
//         last_remark = (doc.repair_remarks || "").trim();
//     }
//     if (normalized_new !== last_remark) {
//         doc.remarks = doc.remarks || [];
//         doc.remarks.push({
//             repair_remarks: normalized_new,
//             timestamp: frappe.datetime.now_datetime()
//         });
//         doc.repair_remarks = normalized_new;
//         return true;
//     }
//     return false;
// }

// // Deduplication Helper: Safely appends repair statuses avoiding duplicates
// function safe_add_status_tracking(doc, repair_status) {
//     if (!repair_status || !repair_status.trim()) return false;
//     let normalized_status = repair_status.trim();
//     let last_status = "";
//     if (doc.rma_status && doc.rma_status.length > 0) {
//         last_status = (doc.rma_status[doc.rma_status.length - 1].repair_status || "").trim();
//     } else {
//         last_status = (doc.repair_status || "").trim();
//     }
//     if (normalized_status !== last_status) {
//         doc.rma_status = doc.rma_status || [];
//         doc.rma_status.push({
//             repair_status: normalized_status,
//             timestamp: frappe.datetime.now_datetime()
//         });
//         doc.repair_status = normalized_status;
//         doc.rma_id_status = normalized_status;
//         return true;
//     }
//     return false;
// }

// // Deduplication Helper: Safely records technician assignment history
// function safe_add_tracking_history(doc, status_type, remarks_text, rma_status_val) {
//     doc.rma_tracking_status = doc.rma_tracking_status || [];
//     let is_duplicate = doc.rma_tracking_status.some(entry =>

//         (entry.status || "").trim() === status_type &&
//         (entry.rma_status || "").trim() === (rma_status_val || "").trim() &&        
//         (entry.remarks || "").trim() === remarks_text.trim()

//     );
//     if (!is_duplicate) {
//         doc.rma_tracking_status.push({
//             status: status_type,
//             timestamp: frappe.datetime.now_datetime(),
//             modified_by1: frappe.session.user,
//             remarks: remarks_text,
//             rma_status: rma_status_val
//         });
//         return true;
//     }
//     return false;
// }

// function inject_pill_directly(frm, cdn, field, value, color, btn_class) {
//     if (!value || !value.trim()) return;
//     if (!frm.fields_dict.repair_and_return || !frm.fields_dict.repair_and_return.grid) return;

//     let btnClass = btn_class || (field === 'used_components' ? 'view-used-components-btn' : 'view-components-btn');
//     let btnColor = color || (field === 'used_components' ? '#2dce89' : '#5e72e4');

//     let $gridRow = frm.fields_dict.repair_and_return.grid.wrapper
//         .find('.grid-row[data-name="' + cdn + '"]');

//     if (!$gridRow.length) {
//         frm.fields_dict.repair_and_return.grid.wrapper
//             .find('.grid-row').each(function () {
//                 let idx = $(this).attr('data-idx');
//                 if (!idx) return;
//                 let rowIndex = parseInt(idx) - 1;
//                 let doc = (frm.doc.repair_and_return || [])[rowIndex];
//                 if (doc && doc.name === cdn) {
//                     $gridRow = $(this);
//                     return false; // break
//                 }
//             });
//     }

//     if (!$gridRow.length) return;

//     let $cell = $gridRow.find('[data-fieldname="' + field + '"]');
//     if (!$cell.length) return;

//     let rowIdx = $gridRow.attr('data-idx');
//     let actualRowIndex = rowIdx ? parseInt(rowIdx) - 1 : 0;

//     let btn = `
//         <div style="width:100%;display:flex;justify-content:center;align-items:center;">
//             <button class="btn btn-xs ${btnClass}" data-row-idx="${actualRowIndex}"
//                 style="font-size:11px;padding:3px 12px;border-radius:12px;background:${btnColor};color:#fff;border:none;cursor:pointer;">
//                 View
//             </button>
//         </div>`;

//     $cell.html(btn).css({
//         "display": "flex",
//         "justify-content": "center",
//         "align-items": "center",
//         "text-align": "center"
//     });
// }

// frappe.ui.form.on('Repair and Return Technician View', {
//     refresh: async function (frm) {

//         frm.set_query("repair_status", "repair_and_return", function () {
//             return { filters: { "repair_and_return_tech_view": 1 } };
//         });

//         if (frm.custom_buttons["Get Data"]) {
//             frm.remove_custom_button("Get Data");
//         }

//         frm.add_custom_button(__('Get Data'), function () {
//             load_technician_rma_data(frm);
//         }).addClass('btn-primary');

//         frm.remove_custom_button(__('Create Material Request'));

//         if (!frm.doc.repair_and_return || !frm.doc.repair_and_return.length) return;

//         let rma_ids = frm.doc.repair_and_return
//             .map(row => (row.rma_id || '').trim())
//             .filter(rma => rma);

//         if (!rma_ids.length) return;

//         let stock_entries = await frappe.db.get_list('Stock Entry', {
//             filters: { stock_entry_type: "Material Transfer" },
//             fields: ["name", "custom_rma_id"]
//         });

//         let material_transfer_exists = false;
//         for (let se of stock_entries) {
//             if (!se.custom_rma_id) continue;
//             let se_rmas = se.custom_rma_id.split(',').map(r => r.trim());
//             if (rma_ids.some(rma => se_rmas.includes(rma))) {
//                 material_transfer_exists = true;
//                 break;
//             }
//         }

//         if (!material_transfer_exists) {
//             frm.add_custom_button(__('Create Material Request'), async function () {

//                 let items_with_components = frm.doc.repair_and_return.filter(item =>
//                     item.component_used && item.component_used.trim() !== ''
//                 );

//                 if (items_with_components.length === 0) {
//                     frappe.msgprint(__('No items found with components'));
//                     return;
//                 }

//                 let invalid_status_items = items_with_components.filter(item => item.repair_status !== 'Under Repair');
//                 if (invalid_status_items.length > 0) {
//                     let invalid_rmas = invalid_status_items.map(item => `<b>${item.rma_id}</b> (${item.repair_status || 'Not Set'})`).join('<br>');
//                     frappe.throw({
//                         title: __('Repair Status Error'),
//                         indicator: 'red',
//                         message: `<div style="padding:5px;"><p style="font-size:14px;color:#333;">Material requests can only be created for items currently in <b>Under Repair</b> status.</p><p style="font-size:13px;color:#d9534f;font-weight:bold;margin-top:10px;">Please update the status for the following RMA records first:</p><div style="background:#fdf7f7;border-left:4px solid #d9534f;padding:10px;margin-top:5px;font-family:monospace;">${invalid_rmas}</div></div>`
//                     });
//                     return;
//                 }

//                 let rma_ids_list = items_with_components.map(item => item.rma_id).join(', ');
//                 let components = [];
//                 let qty_map = {};

//                 for (let row of items_with_components) {
//                     let parsed_items = parse_component_string(row.component_used);
//                     let item_docs = await get_item_docs_by_codes(parsed_items.map(i => i.item_code));

//                     parsed_items.forEach(item => {
//                         let resolved_doc = item_docs.find(doc => doc.name === item.item_code || doc.item_name === item.item_code);
//                         let resolved_code = resolved_doc ? resolved_doc.name : item.item_code;

//                         components.push(resolved_code);
//                         qty_map[resolved_code] = (qty_map[resolved_code] || 0) + item.qty;
//                     });

//                     try {
//                         let doc = await frappe.db.get_doc('RMA BIN', row.rma_id);

//                         // Deduplicate remarks and rma_status entries before saving
//                         // safe_add_remark(doc, row.repair_remarks);
//                         // safe_add_status_tracking(doc, row.repair_status);

//                         if ('component_requested' in doc) doc.component_requested = row.component_used;
//                         if ('requested_components' in doc) doc.requested_components = row.component_used;

//                         doc.component_details = [];
//                         parsed_items.forEach(item => {
//                             let resolved_doc = item_docs.find(doc => doc.name === item.item_code || doc.item_name === item.item_code);
//                             let resolved_code = resolved_doc ? resolved_doc.name : item.item_code;

//                             doc.component_details.push({
//                                 doctype: "component_used",
//                                 component_name: resolved_code,
//                                 qty: item.qty
//                             });
//                         });
//                         doc.fault_found = row.fault_found;
//                         doc.repaired_date = row.assigned_date;
//                         doc.rma_id_status = row.repair_status;
//                         await frappe.call({
//                             method: 'frappe.client.save',
//                             args: { doc: doc }
//                         });
//                         frappe.show_alert({ message: __('Requested components saved for: ' + row.rma_id), indicator: 'green' });
//                     } catch (err) {
//                         console.error("Failed to update RMA BIN database:", err);
//                     }
//                 }

//                 components = [...new Set(components)];
//                 let item_docs = await get_item_docs_by_codes(components);

//                 if (!item_docs.length) {
//                     frappe.msgprint(__('Could not fetch component details'));
//                     return;
//                 }

//                 let draft_entry = null;
//                 let submitted_item_codes = [];

//                 let stock_entries = await frappe.db.get_list('Stock Entry', {
//                     filters: { stock_entry_type: "Material Transfer" },
//                     fields: ["name", "custom_rma_id", "docstatus"]
//                 });

//                 for (let se of stock_entries) {
//                     if (!se.custom_rma_id) continue;
//                     let se_rmas = se.custom_rma_id.split(',').map(r => r.trim());
//                     let current_rmas = rma_ids_list.split(',').map(r => r.trim());
//                     if (!current_rmas.some(r => se_rmas.includes(r))) continue;
//                     let se_doc = await frappe.db.get_doc("Stock Entry", se.name);
//                     if (se.docstatus === 0) { draft_entry = se_doc; break; }
//                     if (se.docstatus === 1) { se_doc.items.forEach(i => submitted_item_codes.push(i.item_code)); }
//                 }

//                 if (draft_entry) {
//                     let blocked = [...new Set([...draft_entry.items.map(i => i.item_code), ...submitted_item_codes])];
//                     let new_items = item_docs.filter(i => !blocked.includes(i.name));
//                     if (!new_items.length) { frappe.show_alert({ message: __('All selected components are already present in the existing draft or submitted entries.'), indicator: 'orange' }); return; }
//                     new_items.forEach(item => {
//                         let parsed = parsed_items.find(x => x.item_code === item.name || x.item_code === item.item_name);
//                         let q = parsed ? parsed.qty : (qty_map[item.name] || 1);
//                         draft_entry.items.push({ item_code: item.name, item_name: item.item_name, description: item.description || item.item_name, uom: item.stock_uom || 'Nos', stock_uom: item.stock_uom || 'Nos', s_warehouse: draft_entry.from_warehouse, t_warehouse: draft_entry.to_warehouse, conversion_factor: 1, qty: q, transfer_qty: q, basic_rate: item.valuation_rate || 0 });
//                     });
//                     await frappe.call({ method: "frappe.client.save", args: { doc: draft_entry } });
//                     frappe.show_alert({ message: __('New components added to Draft: ' + draft_entry.name), indicator: 'green' });
//                     frappe.set_route("Form", "Stock Entry", draft_entry.name);
//                     return;
//                 }

//                 let remaining = item_docs.filter(i => !submitted_item_codes.includes(i.name));
//                 if (!remaining.length) { frappe.show_alert({ message: __('All selected components have already been requested in completed entries.'), indicator: 'orange' }); return; }
//                 item_docs = remaining;

//                 frappe.new_doc('Stock Entry', { stock_entry_type: 'Material Transfer', custom_technician: frm.doc.technician, purpose: 'Material Transfer', custom_customer: items_with_components[0].customer, custom_rma_id: rma_ids_list }, doc => {
//                     setTimeout(async () => {
//                         let se_frm = cur_frm;
//                         se_frm.doc.from_warehouse = "Ductus Technologies Pvt Ltd - DTPL";
//                         se_frm.doc.to_warehouse = "Repair Floor - DTPL";
//                         se_frm.clear_table('items');
//                         let res_data = await frappe.db.get_value('RMA', { 'name': frm.doc.lot_no }, 'warehouse');
//                         item_docs.forEach(function (item) {
//                             let q = qty_map[item.name] || 1;
//                             let row = se_frm.add_child('items');
//                             row.item_code = item.name; row.item_name = item.item_name;
//                             row.description = item.description || item.item_name;
//                             row.uom = item.stock_uom || 'Nos'; row.stock_uom = item.stock_uom || 'Nos';
//                             row.s_warehouse = res_data?.message?.warehouse || 'Ductus Technologies Pvt Ltd - DTPL'; row.t_warehouse = 'Repair Floor - DTPL';
//                             row.conversion_factor = 1; row.qty = q; row.transfer_qty = q; row.basic_rate = item.valuation_rate || 0;
//                         });
//                         se_frm.refresh_field('items');
//                         frappe.show_alert({ message: __('Material Transfer created with ' + item_docs.length + ' components.'), indicator: 'blue' });
//                     }, 500);
//                 });
//             }).addClass('btn-primary');
//         }

//         setup_field_filters(frm);
//         setTimeout(() => { format_components_as_pills(frm); }, 1000);
//     },

//     customer: function (frm) {
//         if (frm.doc.lot_no) frm.set_value('lot_no', '');
//     },

//     onload_post_render: function (frm) {
//         set_current_technician(frm);
//         frm.set_value("lot_no", "");
//         frm.set_value("customer", "");
//         frm.set_value("circle", "");
//         frm.set_value("warranty_status", "");
//         frm.clear_table("repair_and_return");
//         frm.refresh_field("repair_and_return");
//     },

//     validate: async function (frm) {
//         let oldData = [];
//         try {
//             oldData = JSON.parse(localStorage.getItem("repair_and_return_technician_view_snapshot") || "[]");
//         } catch (e) {
//             console.error("Error loading snapshot", e);
//         }

//         for (let row of frm.doc.repair_and_return || []) {

//             // Skip untouched rows completely
//             if (row.is_modified !== 1) {
//                 continue;
//             }

//             // If this row was modified, Repair Status is compulsory
//             if (!row.repair_status || !String(row.repair_status).trim()) {
//                 frappe.throw({
//                     title: __('Repair Status Missing'),
//                     indicator: 'red',
//                     message: __(
//                         `Repair Status is mandatory for RMA ID <b>${row.rma_id || ''}</b> because this row was modified.`
//                     )
//                 });
//             }

//             let original = oldData.find(o => o.rma_id === row.rma_id);

//             if (original) {
//                 const normalize = val => (val === undefined || val === null) ? "" : String(val).trim();
//                 let orig_status = normalize(original.repair_status || original.rma_id_status);
//                 let curr_status = normalize(row.repair_status);

//                 let orig_remarks = "";
//                 if (original.remarks && original.remarks.length > 0) {
//                     orig_remarks = normalize(original.remarks[original.remarks.length - 1]?.repair_remarks);
//                 } else {
//                     orig_remarks = normalize(original.repair_remarks);
//                 }

//                 let orig_components = normalize(original.component_requested || original.requested_components || original.component_used);
//                 let curr_components = normalize(row.component_used);
//                 let orig_used = normalize(original.component_used_init);
//                 let curr_used = normalize(row.used_components);

//                 if (orig_status !== "Under Repair" && curr_status !== "Under Repair") {
//                     if (
//                         orig_status !== curr_status ||
//                         normalize(row.repair_remarks) !== orig_remarks ||
//                         curr_components !== orig_components ||
//                         curr_used !== orig_used
//                     ) {
//                         frappe.throw({
//                             title: __('Repair Status Error'),
//                             indicator: 'orange',
//                             message: `<div style="text-align:center;padding:10px;">
//                             <div style="font-size:40px;color:#f39c12;margin-bottom:12px;">⚠️</div>
//                             <h4 style="color:#333;margin-top:0;font-weight:600;">Repair Status Required</h4>
//                             <p style="color:#555;font-size:13px;line-height:1.6;">
//                                 To start repairs, add components, write remarks, or update status for RMA:
//                                 <br><strong style="color:#000;">${row.rma_id}</strong>,
//                                 <br>You must first set the Repair Status to
//                                 <span class="label label-warning" style="font-size:11px;padding:2px 6px;"><b>Under Repair</b></span>
//                             </p>
//                         </div>`
//                         });
//                         return false;
//                     }
//                 }
//             }

//             if (!row.start_time) {
//                 frappe.throw({
//                     title: __('Start Time Missing'),
//                     message: __('Start Time is required for RMA ID: <b>' + row.rma_id + '</b><br>Please click "Get Data" button first to populate Start Time.'),
//                     indicator: 'red'
//                 });
//                 return false;
//             }

//             if (!row.end_time) row.end_time = frappe.datetime.now_datetime();

//             if (row.start_time && row.end_time) {
//                 const tat_value = calculate_tat(row.start_time, row.end_time);
//                 row.tat = tat_value;
//                 row.total_tat = tat_value;
//             }
//         }

//         frm.refresh_field("repair_and_return");
//     },

//     // =============================================================================
//     // before_save: Prepares modifications locally.
//     // Queue RMA BIN changes to execute safely inside after_save.
//     // =============================================================================
//     before_save: function (frm) {
//         return new Promise(async (resolve, reject) => {
//             try {
//                 let oldData = JSON.parse(localStorage.getItem("repair_and_return_technician_view_snapshot") || "[]");
//                 let local_storage_val = [];
//                 frm.rma_docs_to_save = []; // Initialize database queue for after_save

//                 for (let row of (frm.doc.repair_and_return || [])) {
//                     let original = oldData.find(o => o.rma_id === row.rma_id);

//                     function normalize(val) {
//                         return (val === undefined || val === null) ? "" : String(val).trim();
//                     }

//                     // Strict comparison tracking to prevent redundant updates
//                     let currentStatus = normalize(row.repair_status);
//                     let currentRemarks = normalize(row.repair_remarks);
//                     let currentComponents = normalize(row.component_used);
//                     let currentUsedComponents = normalize(row.used_components);
//                     let currentFaultFound = normalize(row.fault_found);
//                     let currentSerialNo = normalize(row.serial_no);
//                     let currentAssignedDate = normalize(row.assigned_date);

//                     let origStatus = original ? normalize(original.rma_id_status || original.repair_status) : '';
//                     let origRemarks = "";
//                     if (original && original.remarks && original.remarks.length > 0) {
//                         origRemarks = normalize(original.remarks[original.remarks.length - 1]?.repair_remarks);
//                     } else if (original) {
//                         origRemarks = normalize(original.repair_remarks);
//                     }
//                     let origComponents = original ? normalize(original.component_requested || original.requested_components || original.component_used) : '';
//                     let origUsedComponents = original ? normalize(original.component_used_init) : '';
//                     let origFaultFound = original ? normalize(original.fault_found) : '';
//                     let origSerialNo = original ? normalize(original.serial_no) : '';
//                     let origAssignedDate = original ? normalize(original.repaired_date) : '';

//                     let statusChanged = currentStatus !== origStatus;
//                     let remarksChanged = currentRemarks !== origRemarks && currentRemarks !== "";
//                     let componentsChanged = currentComponents !== origComponents;
//                     let usedComponentsChanged = currentUsedComponents !== origUsedComponents;
//                     let faultFoundChanged = currentFaultFound !== origFaultFound;
//                     let serialNoChanged = currentSerialNo !== origSerialNo;
//                     let assignedDateChanged = currentAssignedDate !== origAssignedDate;

//                     let hasAnyChange = statusChanged || remarksChanged || componentsChanged || usedComponentsChanged || faultFoundChanged || serialNoChanged || assignedDateChanged;

//                     if (hasAnyChange) {
//                         console.log("Preparing RMA BIN update parameters for:", row.rma_id);

//                         let rmaDoc = await frappe.db.get_doc("RMA BIN", row.rma_id);
//                         let docChanged = false;

//                         // 1. repaired_date
//                         if (assignedDateChanged) {
//                             rmaDoc.repaired_date = row.assigned_date;
//                             docChanged = true;
//                         }

//                         // 2. start/end repair times
//                         if (original && original.repair_and_return_start_time) {
//                             if (!original.repair_and_return_end_time && row.repair_status !== "Under Repair") {
//                                 rmaDoc.repair_and_return_end_time = frappe.datetime.now_datetime();
//                                 rmaDoc.total_repair_time = calculate_tat(original.repair_and_return_start_time, rmaDoc.repair_and_return_end_time);
//                                 docChanged = true;
//                             }
//                         } else if (row.repair_status === "Under Repair") {
//                             rmaDoc.repair_and_return_start_time = frappe.datetime.now_datetime();
//                             docChanged = true;
//                         }

//                         // 3. fault_found
//                         if (faultFoundChanged) {
//                             rmaDoc.fault_found = row.fault_found;
//                             docChanged = true;
//                         }

//                         // 4. Requested Components
//                         if (componentsChanged) {
//                             rmaDoc.component_requested = row.component_used;
//                             rmaDoc.requested_components = row.component_used;
//                             docChanged = true;

//                             rmaDoc.component_details = [];

//                             let parsed_items = parse_component_string(row.component_used);
//                             let item_docs = await get_item_docs_by_codes(parsed_items.map(i => i.item_code));

//                             parsed_items.forEach(item => {
//                                 let resolved_doc = item_docs.find(doc => doc.name === item.item_code || doc.item_name === item.item_code);
//                                 let resolved_code = resolved_doc ? resolved_doc.name : item.item_code;

//                                 rmaDoc.component_details.push({
//                                     doctype: "component_used",
//                                     component_name: resolved_code,
//                                     qty: item.qty
//                                 });
//                             });
//                         }

//                         // 5. Used Components
//                         if (usedComponentsChanged) {
//                             rmaDoc.component_used_init = row.used_components;
//                             docChanged = true;
//                         }

//                         // 6. repair_status (using deduplicated tracker helper)
//                         if (statusChanged) {

//                             let addedStatus = safe_add_status_tracking(rmaDoc, row.repair_status);

//                             if (addedStatus)
//                                 docChanged = true;

//                             let addedTrack = safe_add_tracking_history(
//                                 rmaDoc,
//                                 "RMA Technician Update",
//                                 "Repair Status Updated to " + row.repair_status,
//                                 row.repair_status
//                             );

//                             if (addedTrack)
//                                 docChanged = true;
//                         }


//                         // 7. repair_remarks (using deduplicated helper to completely avoid repeats)
//                         if (remarksChanged) {
//                             let addedRemark = safe_add_remark(rmaDoc, row.repair_remarks);
//                             if (addedRemark) docChanged = true;
//                         }

//                         // 8. repaired_by tracking
//                         // if (original && normalize(row.repaired_by) !== normalize(original.repaired_by) && row.repair_status) {
//                         //     let addedTrack = safe_add_tracking_history(
//                         //         rmaDoc, 
//                         //         "RMA Technician Update", 
//                         //         "Repair Status Updated to "+ row.repair_status, 
//                         //         row.repair_status
//                         //     );
//                         //     if (addedTrack) docChanged = true;
//                         // }

//                         // 9. serial_no
//                         if (serialNoChanged) {
//                             rmaDoc.serial_no = row.serial_no;
//                             docChanged = true;
//                         }

//                         // Material Issue trigger flag
//                         row.trigger_material_issue = 0;

//                         let currentStatus = normalize(row.repair_status);
//                         let previousStatus = normalize(original?.rma_id_status);

//                         if (
//                             original &&
//                             (
//                                 currentStatus === "Repaired & Ready for Quality check" ||
//                                 currentStatus === "Scrap"
//                             ) &&
//                             currentStatus !== previousStatus
//                         ) {
//                             row.trigger_material_issue = 1;
//                         }

//                         // row.trigger_material_issue = 0;
//                         // if (original && normalize(row.repair_status) === "Repaired & Ready for Quality check" && normalize(original.rma_id_status) !== "Repaired & Ready for Quality check") {
//                         //     row.trigger_material_issue = 1;
//                         // }

//                         // Stock validation for each requested component before allowing finished status
//                         // if (row.repair_status === "Repaired & Ready for Quality check" && row.component_used && !row.material_issue) {
//                         if ((row.repair_status === "Repaired & Ready for Quality check" || row.repair_status === "Scrap") &&
//                             row.component_used &&
//                             !row.material_issue) {
                    
//                             let parsed_items = parse_component_string(row.component_used);
//                             let item_docs = await get_item_docs_by_codes(parsed_items.map(i => i.item_code));

//                             for (let item of parsed_items) {
//                                 let resolved_doc = item_docs.find(doc => doc.name === item.item_code || doc.item_name === item.item_code);
//                                 let resolved_code = resolved_doc ? resolved_doc.name : item.item_code;

//                                 await frappe.call({
//                                     method: "rms.rms.doctype.repair_and_return_technician_view.repair_and_return_technician_view.validate_component_stock",
//                                     args: {
//                                         item_code: resolved_code,
//                                         warehouse: "Repair Floor - DTPL",
//                                         qty: item.qty
//                                     }
//                                 });
//                             }
//                         }

//                         if (docChanged) {
//                             frm.rma_docs_to_save.push({
//                                 rma_id: row.rma_id,
//                                 doc: rmaDoc
//                             });
//                         } else {
//                             local_storage_val.push(rmaDoc);
//                         }
//                     } else {
//                         if (original) {
//                             local_storage_val.push(original);
//                         } else {
//                             let rmaDoc = await frappe.db.get_doc("RMA BIN", row.rma_id);
//                             local_storage_val.push(rmaDoc);

//                         }
//                     }

//                     resolve();
//                 }
//                 } catch (err) {
//                     console.error("Error preparing RMA BIN docs:", err);
//                     frappe.msgprint({ title: __("Save Failed"), message: __("An error occurred while preparing RMA BIN records. Please check the console log."), indicator: "red" });
//                     reject(err);
//                 }
//             });
//     },

//     // =============================================================================
//     // after_save: Saves queued RMA BIN records to the database.
//     // Triggers material issue generation once standard save confirms.
//     // =============================================================================
//     after_save: async function (frm) {
//         // 1. Database execution of queued RMA BIN updates
//         if (frm.rma_docs_to_save && frm.rma_docs_to_save.length > 0) {
//             let local_storage_val = [];
//             try {
//                 let oldData = JSON.parse(localStorage.getItem("repair_and_return_technician_view_snapshot") || "[]");

//                 for (let item of frm.rma_docs_to_save) {
//                     console.log("Saving RMA BIN in after_save:", item.rma_id);
//                     let savedDoc;
//                     try {
//                         savedDoc = await frappe.call({
//                             method: "frappe.client.save",
//                             args: { doc: item.doc }
//                         });
//                     } catch (saveErr) {
//                         console.error(`Failed saving RMA BIN ${item.rma_id} in after_save:`, saveErr);
//                         frappe.msgprint({
//                             title: __('RMA BIN Save Failed'),
//                             indicator: 'red',
//                             message: __(`Could not save RMA BIN ${item.rma_id}. Check console for details.`)
//                         });
//                         throw saveErr;
//                     }

//                     let doc_msg = savedDoc.message;

//                     // Rebuild component_requested string for snapshot
//                     let req_msg = '';
//                     if (doc_msg.component_details && doc_msg.component_details.length > 0) {
//                         req_msg = doc_msg.component_details.map(d => `${d.component_name || d.item_code || ''} [Qty:${d.qty || 1}]`).join(', ');
//                     } else {
//                         req_msg = doc_msg.requested_components || doc_msg.component_requested || '';
//                     }
//                     doc_msg.component_requested = req_msg;
//                     doc_msg.requested_components = req_msg;
//                     doc_msg.component_used = req_msg;

//                     // Preserve component_used_init
//                     if (!doc_msg.component_used_init && item.doc.component_used_init) {
//                         doc_msg.component_used_init = item.doc.component_used_init;
//                     }

//                     local_storage_val.push(doc_msg);
//                     frappe.show_alert({ message: __(`Updated ${item.rma_id} successfully.`), indicator: 'green' }, 5);
//                 }

//                 // Merge updated records with unmodified snapshot records
//                 let merged_storage = [...local_storage_val];
//                 oldData.forEach(old_row => {
//                     if (!merged_storage.some(m => m.name === old_row.name || m.rma_id === old_row.rma_id)) {
//                         merged_storage.push(old_row);
//                     }
//                 });

//                 localStorage.setItem("repair_and_return_technician_view_snapshot", JSON.stringify(merged_storage));

//             } catch (err) {
//                 console.error("Error saving RMA BIN docs in after_save:", err);
//                 frappe.msgprint({ title: __("Save Failed"), message: __("An error occurred while saving RMA BIN records in after_save. Please check the console log."), indicator: "red" });
//                 return;
//             } finally {
//                 frm.rma_docs_to_save = []; // Clear local processing queue
//             }
//         }

//         // 2. Process finished lines for automatic Material Issue creation (Using Used Components)
//         let rows_to_process = (frm.doc.repair_and_return || []).filter(row =>
//             row.trigger_material_issue == 1 &&
//             row.used_components &&
//             !row.material_issue
//         );

//         // let rows_to_process = (frm.doc.repair_and_return || []).filter(row =>
//         //     row.repair_status === "Repaired & Ready for Quality check" && row.used_components && !row.material_issue
//         // );

//         // if (rows_to_process.length === 0) {
//         //     load_technician_rma_data(frm);
//         //     return;
//         // }

//         async function process_row(index) {
//             if (index >= rows_to_process.length) {
//                 load_technician_rma_data(frm);
//                 return;
//             }

//             let row = rows_to_process[index];
//             try {
//                 // Parse the "Used Components" field
//                 let parsed_items = parse_component_string(row.used_components);
//                 if (!parsed_items.length) { await process_row(index + 1); return; }

//                 let item_docs = await get_item_docs_by_codes(parsed_items.map(i => i.item_code));
//                 if (!item_docs.length) { await process_row(index + 1); return; }

//                 let stock_entry = {
//                     doctype: "Stock Entry",
//                     stock_entry_type: "Material Issue",
//                     purpose: "Material Issue",
//                     custom_customer: row.customer,
//                     custom_rma_id: row.rma_id,
//                     items: []
//                 };

//                 item_docs.forEach(item_doc => {
//                     let parsed = parsed_items.find(x => x.item_code === item_doc.name || x.item_code === item_doc.item_name);
//                     stock_entry.items.push({
//                         item_code: item_doc.name,
//                         item_name: item_doc.item_name,
//                         description: item_doc.description || item_doc.item_name,
//                         s_warehouse: "Repair Floor - DTPL",
//                         cost_center: "Repair Floor - DTPL",
//                         qty: parsed ? parsed.qty : 1
//                     });
//                 });

//                 let r = await frappe.call({
//                     method: "rms.rms.doctype.repair_and_return_technician_view.repair_and_return_technician_view.create_material_issue",
//                     args: { stock_entry_data: stock_entry },
//                     freeze: true, freeze_message: __("Creating Material Issue...")
//                 });

//                 if (r.message && r.message.stock_error) {
//                     frappe.msgprint({ title: __("Insufficient Stock"), indicator: "red", message: r.message.error });
//                 }
//                 // else if (r.message && r.message.success) {
//                 //     frappe.show_alert({ message: __("Material Issue Created & Submitted: " + r.message.stock_entry), indicator: "green" });
//                 // }
//                 else if (r.message && r.message.success) {

//     // Update child table
//                     await frappe.model.set_value(
//                         row.doctype,
//                         row.name,
//                         "material_issue",
//                         r.message.stock_entry
//                     );

//                     // Update RMA BIN
//                     await frappe.db.set_value(
//                         "RMA BIN",
//                         row.rma_id,
//                         "material_issue",
//                         r.message.stock_entry
//                     );

//                     frappe.show_alert({
//                         message: __("Material Issue Created & Submitted: " + r.message.stock_entry),
//                         indicator: "green"
//                     });
//                 }
//                 else {
//                     frappe.msgprint({ title: __("Error"), indicator: "red", message: r.message?.error || __("Unable to create Material Issue") });
//                 }

//             } catch (e) {
//                 console.error("after_save material issue failed", e);
//                 frappe.msgprint({ title: __("Error"), indicator: "red", message: e.message || __("Unable to create Material Issue") });
//             }

//             await process_row(index + 1);
//             console.log({
//                 rma: row.rma_id,
//                 status: row.repair_status,
//                 trigger: row.trigger_material_issue,
//                 used: row.used_components,
//                 material_issue: row.material_issue
//             });
//         }

//         await process_row(0);
//     }
// });

// function format_components_as_pills(frm) {
//     if (!frm.fields_dict.repair_and_return || !frm.fields_dict.repair_and_return.grid) return;

//     // --- Requested Components (component_used) ---
//     frm.fields_dict.repair_and_return.grid.wrapper
//         .find('[data-fieldname="component_used"]').each(function () {
//             let $cell = $(this);
//             if ($cell.closest('.grid-heading-row').length > 0) return;
//             let rowIndex = parseInt($cell.closest('.grid-row').attr('data-idx') || '0') - 1;
//             if (rowIndex < 0 || rowIndex >= (frm.doc.repair_and_return || []).length) return;

//             let rowData = frm.doc.repair_and_return[rowIndex];
//             let val = rowData.component_used || '';

//             if (val.trim()) {
//                 $cell.html(`<div style="width:100%;display:flex;justify-content:center;align-items:center;"><button class="btn btn-xs view-components-btn" data-row-idx="${rowIndex}" style="font-size:11px;padding:3px 12px;border-radius:12px;background:#5e72e4;color:#fff;border:none;cursor:pointer;">View</button></div>`)
//                     .css({ display: "flex", "justify-content": "center", "align-items": "center", "text-align": "center" });
//             } else {
//                 $cell.html('');
//             }
//         });

//     // --- Used Components (used_components) ---
//     frm.fields_dict.repair_and_return.grid.wrapper
//         .find('[data-fieldname="used_components"]').each(function () {
//             let $cell = $(this);
//             if ($cell.closest('.grid-heading-row').length > 0) return;
//             let rowIndex = parseInt($cell.closest('.grid-row').attr('data-idx') || '0') - 1;
//             if (rowIndex < 0 || rowIndex >= (frm.doc.repair_and_return || []).length) return;

//             let rowData = frm.doc.repair_and_return[rowIndex];
//             let val = rowData.used_components || '';

//             if (val.trim()) {
//                 $cell.html(`<div style="width:100%;display:flex;justify-content:center;align-items:center;"><button class="btn btn-xs view-used-components-btn" data-row-idx="${rowIndex}" style="font-size:11px;padding:3px 12px;border-radius:12px;background:#2dce89;color:#fff;border:none;cursor:pointer;">View</button></div>`)
//                     .css({ display: "flex", "justify-content": "center", "align-items": "center", "text-align": "center" });
//             } else {
//                 $cell.html('');
//             }
//         });

//     // --- Bind click: Requested Components ---
//     $(document).off('click', '.view-components-btn');
//     $(document).on('click', '.view-components-btn', function (e) {
//         e.preventDefault(); e.stopPropagation();
//         let idx = $(this).data('row-idx');
//         let rowData = frm.doc.repair_and_return[idx];
//         let val = rowData.component_used || '';
//         if (!val) { frappe.msgprint('No components found'); return; }
//         open_components_view_dialog(rowData.rma_id, val, 'Requested Components');
//     });

//     // --- Bind click: Used Components ---
//     $(document).off('click', '.view-used-components-btn');
//     $(document).on('click', '.view-used-components-btn', function (e) {
//         e.preventDefault(); e.stopPropagation();
//         let idx = $(this).data('row-idx');
//         let rowData = frm.doc.repair_and_return[idx];
//         let val = rowData.used_components || '';
//         if (!val) { frappe.msgprint('No used components found'); return; }
//         open_components_view_dialog(rowData.rma_id, val, 'Used Components');
//     });
// }

// function open_components_view_dialog(rma_id, componentText, titlePrefix) {
//     let entries = componentText.split(',').map(s => s.trim()).filter(Boolean);
//     let rows_html = entries.map(function (entry) {
//         let qty = 1; let name = entry;
//         let m = entry.match(/\[Qty:(\d+)\]$/);
//         if (m) { qty = parseInt(m[1]); name = entry.replace(/\s*\[Qty:\d+\]$/, '').trim(); }
//         return `<div style="display:flex;justify-content:space-between;align-items:center;padding:10px 14px;border-bottom:1px solid #f0f0f0;"><div style="font-size:13px;color:#333;"><span style="display:inline-block;width:7px;height:7px;background:#5e72e4;border-radius:50%;margin-right:8px;"></span>${name}</div><div style="font-size:13px;font-weight:600;color:#5e72e4;">Qty: ${qty}</div></div>`;
//     }).join('');

//     let d = new frappe.ui.Dialog({ title: titlePrefix + ' — ' + (rma_id || ''), size: 'large', fields: [{ fieldtype: 'HTML', fieldname: 'comp_html' }] });
//     d.fields_dict.comp_html.$wrapper.html(`<div style="border:1px solid #e3e3e3;border-radius:6px;overflow:hidden;margin-top:8px;"><div style="display:flex;justify-content:space-between;padding:8px 14px;background:#f8f9fa;font-size:11px;font-weight:600;color:#6c757d;text-transform:uppercase;letter-spacing:0.5px;border-bottom:1px solid #e3e3e3;"><span>Component</span><span>Quantity</span></div>${rows_html}</div>`);
//     d.show();
// }

// function trigger_select_components_dialog(frm, cdt, cdn, target_field, dialog_title) {
//     let row = locals[cdt][cdn];
//     let _dialog_called = false;

//     frappe.call({
//         method: "frappe.client.get_list",
//         args: {
//             doctype: "Item",
//             filters: { disabled: 0, item_group: "Components" },
//             fields: ["name", "item_name", "item_code"],
//             limit_page_length: 0,
//             order_by: "item_name asc"
//         },
//         callback: function (r) {
//             if (_dialog_called) return;
//             _dialog_called = true;
//             if (!r.message || !r.message.length) { frappe.msgprint("No components found"); return; }
//             open_components_dialog(r.message);
//         }
//     });

//     function open_components_dialog(components_data) {
//         let basket = {};

//         // Pre-populate basket from existing value using item_code matching 
//         let current_value = row[target_field] || '';
//         if (current_value) {
//             current_value.split(',').map(s => s.trim()).filter(Boolean).forEach(function (entry) {
//                 let qty = 1; let item_code = entry;
//                 let m = entry.match(/\[Qty:(\d+)\]$/);
//                 if (m) { qty = parseInt(m[1]); item_code = entry.replace(/\s*\[Qty:\d+\]$/, '').trim(); }
//                 let found = components_data.find(c => c.item_code === item_code || c.name === item_code || c.item_name === item_code);
//                 let display_name = found ? found.item_name : item_code;
//                 basket[item_code] = { item_code: item_code, item_name: display_name, qty: qty };
//             });
//         }

//         let d = new frappe.ui.Dialog({
//             title: dialog_title,
//             size: "large",
//             fields: [{
//                 fieldtype: "HTML",
//                 fieldname: "main_html",
//                 options: `
//                 <div style="display:flex;gap:12px;min-height:320px;">
//                     <div style="flex:1;display:flex;flex-direction:column;">
//                         <div style="font-size:11px;font-weight:600;color:#6c757d;text-transform:uppercase;letter-spacing:0.5px;margin-bottom:6px;">Available Components</div>
//                         <input type="text" class="comp-search" placeholder="Search..." style="width:100%;padding:7px 10px;border:1px solid #d0d5dd;border-radius:6px;font-size:13px;outline:none;box-sizing:border-box;margin-bottom:8px;"/>
//                         <div class="comp-list" style="max-height:250px;overflow-y:auto;border:1px solid #e3e3e3;border-radius:6px;"></div>
//                     </div>
//                     <div style="width:1px;background:#e3e3e3;margin:20px 0;"></div>
//                     <div style="flex:1;display:flex;flex-direction:column;">
//                         <div style="font-size:11px;font-weight:600;color:#6c757d;text-transform:uppercase;letter-spacing:0.5px;margin-bottom:6px;">Added Components</div>
//                         <div class="basket-count" style="font-size:12px;color:#5e72e4;margin-bottom:8px;">0 component(s) added</div>
//                         <div class="basket-container" style="max-height:250px;overflow-y:auto;border:1px solid #e3e3e3;border-radius:6px;">
//                             <div style="padding:10px;font-size:13px;color:#aaa;text-align:center;">No components added yet</div>
//                         </div>
//                     </div>
//                 </div>
//                 <div style="margin-top:14px;text-align:right;">
//                     <button class="finish-btn" style="padding:8px 24px;background:#5e72e4;color:#fff;border:none;border-radius:6px;font-size:13px;font-weight:600;cursor:pointer;">✓ Finish &amp; Save</button>
//                 </div>`
//             }]
//         });

//         d.show();
//         let $w = d.$wrapper;

//         function get_basket_html() {
//             let keys = Object.keys(basket);
//             if (!keys.length) return '<div style="padding:10px;font-size:13px;color:#aaa;text-align:center;">No components added yet</div>';
//             return keys.map(function (code) {
//                 let s = basket[code];
//                 return `<div style="display:flex;align-items:center;justify-content:space-between;padding:8px 10px;border-bottom:1px solid #f0f0f0;"><div style="flex:1;font-size:13px;color:#333;"><span style="display:inline-block;width:7px;height:7px;background:#5e72e4;border-radius:50%;margin-right:8px;"></span>${s.item_name}</div><div style="display:flex;align-items:center;gap:6px;"><span style="font-size:12px;color:#888;">Qty:</span><div style="display:flex;align-items:center;border:1px solid #d0d5dd;border-radius:6px;overflow:hidden;"><button class="bsk-minus" data-code="${code}" style="width:26px;height:26px;background:#f8f9fa;border:none;font-size:15px;cursor:pointer;color:#555;">−</button><input type="number" class="bsk-qty" data-code="${code}" value="${s.qty}" min="1" style="width:40px;height:26px;border:none;border-left:1px solid #d0d5dd;border-right:1px solid #d0d5dd;text-align:center;font-size:13px;outline:none;"/><button class="bsk-plus" data-code="${code}" style="width:26px;height:26px;background:#f8f9fa;border:none;font-size:15px;cursor:pointer;color:#555;">+</button></div><button class="bsk-remove" data-code="${code}" style="background:none;border:none;color:#e74c3c;font-size:18px;cursor:pointer;padding:0 4px;">×</button></div></div>`;
//             }).join('');
//         }

//         function bind_basket_events() {
//             let $bc = $w.find('.basket-container');
//             $bc.find('.bsk-plus').off('click').on('click', function () { basket[$(this).data('code')].qty = (basket[$(this).data('code')].qty || 1) + 1; refresh_basket(); });
//             $bc.find('.bsk-minus').off('click').on('click', function () { basket[$(this).data('code')].qty = Math.max(1, (basket[$(this).data('code')].qty || 1) - 1); refresh_basket(); });
//             $bc.find('.bsk-qty').off('input').on('input', function () { let v = parseInt($(this).val()) || 1; basket[$(this).data('code')].qty = v < 1 ? 1 : v; });
//             $bc.find('.bsk-remove').off('click').on('click', function () { delete basket[$(this).data('code')]; refresh_basket(); });
//         }

//         function refresh_basket() {
//             $w.find('.basket-container').html(get_basket_html());
//             bind_basket_events();
//             $w.find('.basket-count').text(Object.keys(basket).length + ' component(s) added');
//         }

//         function render_list(data) {
//             let $list = $w.find('.comp-list');
//             $list.empty();
//             if (!data.length) { $list.append('<div style="padding:10px 14px;font-size:13px;color:#aaa;">No components found</div>'); return; }
//             data.forEach(function (item) {
//                 let is_sel = !!basket[item.name] || !!basket[item.item_code];
//                 let $row_el = $(`<div style="display:flex;align-items:center;padding:8px 12px;cursor:pointer;border-bottom:1px solid #f5f5f5;background:${is_sel ? '#eef0fd' : '#fff'};"><div style="width:15px;height:15px;border:1.5px solid ${is_sel ? '#5e72e4' : '#ccc'};border-radius:3px;background:${is_sel ? '#5e72e4' : '#fff'};margin-right:10px;flex-shrink:0;display:flex;align-items:center;justify-content:center;">${is_sel ? '<span style="color:#fff;font-size:10px;">✓</span>' : ''}</div><div style="flex:1;font-size:13px;color:#333;">${item.item_name}</div><div style="font-size:11px;color:#999;">${item.name || item.item_code}</div></div>`);
//                 $row_el.on('click', function () {
//                     let code = item.name || item.item_code;
//                     if (!basket[code]) {
//                         basket[code] = { item_code: code, item_name: item.item_name, qty: 1 };
//                         frappe.show_alert({ message: '"' + item.item_name + '" added', indicator: 'green' });
//                     } else {
//                         frappe.show_alert({ message: '"' + item.item_name + '" already added. Adjust qty on right.', indicator: 'blue' });
//                     }
//                     let q = $w.find('.comp-search').val().toLowerCase();
//                     render_list(components_data.filter(c => (c.item_name || '').toLowerCase().includes(q) || (c.name || '').toLowerCase().includes(q) || (c.item_code || '').toLowerCase().includes(q)));
//                     refresh_basket();
//                 });
//                 $list.append($row_el);
//             });
//         }

//         setTimeout(function () {
//             render_list(components_data);
//             refresh_basket();

//             $w.find('.comp-search').on('input', function () {
//                 let q = $(this).val().toLowerCase();
//                 render_list(components_data.filter(c => (c.item_name || '').toLowerCase().includes(q) || (c.name || '').toLowerCase().includes(q) || (c.item_code || '').toLowerCase().includes(q)));
//             });

//             $w.find('.finish-btn').on('click', function () {
//                 let keys = Object.keys(basket);

//                 let final_string = keys.map(function (code) {
//                     let s = basket[code];
//                     return (s.item_code || code) + ' [Qty:' + s.qty + ']';
//                 }).join(', ');

//                 locals[cdt][cdn].is_modified = 1;

//                 // Set value locally in memory ONLY - immediate DB sets are removed to stop pre-mature Material Issues
//                 frappe.model.set_value(cdt, cdn, target_field, final_string).then(async function () {
//                     let current_row = locals[cdt][cdn];
//                     current_row.is_modified = 1;
//                     frm.refresh_field("repair_and_return");

//                     setTimeout(() => {
//                         format_components_as_pills(frm);
//                     }, 300);

//                     console.log(target_field + " saved locally:", current_row[target_field]);
//                 });

//                 frappe.show_alert({ message: 'Components updated locally — ' + keys.length + ' component(s) saved', indicator: 'green' });
//                 d.hide();
//             });
//         }, 500);
//     }
// }

// function set_current_technician(frm) {
//     let current_user = frappe.session.user;
//     frappe.call({
//         method: "frappe.client.get",
//         args: { doctype: "Employee", filters: { 'prefered_email': current_user } },
//         callback: function (r) {
//             frm.set_value("technician", "");
//             if (r.message && r.message.user_id) {
//                 let employee_id = r.message.name;
//                 if (employee_id.includes(' - ')) employee_id = employee_id.split(' - ')[0];
//                 if (!frm.doc.technician.includes(' - ')) {
//                     frappe.db.get_value('Employee', employee_id, ['employee', 'employee_name'])
//                         .then(r => {
//                             if (r.message) {
//                                 frm.set_value('technician', `${r.message.employee} - ${r.message.employee_name}`);
//                             }
//                         })
//                         .catch(err => { console.error('Error fetching employee:', err); });
//                 }
//             }
//         }
//     });
// }

// function setup_field_filters(frm) {
//     frm.set_query("lot_no", function () {
//         let filters = {};
//         if (frm.doc.customer) filters.customer = frm.doc.customer;
//         return { filters: filters, ignore_user_permissions: 1, order_by: "creation desc" };
//     });
// }

// function load_technician_rma_data(frm) {
//     if (!frm.doc.technician) {
//         frappe.show_alert({ message: 'Technician field is required', indicator: 'red' });
//         return;
//     }

//     frappe.call({
//         method: "rms.rms.doctype.repair_and_return_technician_view.repair_and_return_technician_view.get_technician_rma_data",
//         args: {
//             technician: frm.doc.technician,
//             customer: frm.doc.customer || '',
//             lot_no: frm.doc.lot_no || '',
//             warranty_status: frm.doc.warranty_status || '',
//             circle: frm.doc.circle || '',
//             rma_id: frm.doc.rma_id || '',
//             repair_status: frm.doc.repair_status || ''
//         },
//         callback: async function (r) {
//             frm.clear_table("repair_and_return");
//             frm.refresh_field("repair_and_return");

//             if (r.message && r.message.length > 0) {

//                 let rma_ids = r.message.map(row => row.rma_id || row.name).filter(Boolean);
//                 let fresh_data_map = {};

//                 if (rma_ids.length > 0) {
//                     try {
//                         let docs = await Promise.all(rma_ids.map(id => frappe.db.get_doc('RMA BIN', id)));
//                         docs.forEach(doc => {
//                             if (doc) {
//                                 fresh_data_map[doc.name] = {
//                                     component_used_init: doc.component_used_init || '',
//                                     component_requested: doc.component_requested || '',
//                                     requested_components: doc.requested_components || '',
//                                     rma_id_status: doc.rma_id_status || doc.repair_status || '',
//                                     fault_found: doc.fault_found || '',
//                                     repaired_date: doc.repaired_date || '',
//                                     component_details: doc.component_details || []
//                                 };
//                             }
//                         });
//                     } catch (err) {
//                         console.error("Error bulk-fetching RMA BIN data:", err);
//                     }
//                 }

//                 r.message.forEach(function (row) {
//                     let fresh = fresh_data_map[row.rma_id || row.name];
//                     if (fresh) {
//                         row.component_details = fresh.component_details;
//                         row.component_used_init = fresh.component_used_init;
//                         row.component_requested = fresh.component_requested;
//                         row.requested_components = fresh.requested_components;
//                         row.rma_id_status = fresh.rma_id_status;
//                         row.fault_found = fresh.fault_found;
//                         row.repaired_date = fresh.repaired_date;
//                     }
//                 });

//                 r.message.forEach(function (row) {
//                     let req_comps = '';
//                     if (row.component_details && row.component_details.length > 0) {
//                         req_comps = row.component_details.map(d => `${d.component_name || d.item_code || ''} [Qty:${d.qty || 1}]`).join(', ');
//                     } else {
//                         req_comps = row.component_requested || row.requested_components || '';
//                     }
//                     row.component_requested = req_comps;
//                     row.requested_components = req_comps;
//                     row.component_used = req_comps;
//                     row.component_used_init = row.component_used_init || '';
//                 });

//                 localStorage.setItem("repair_and_return_technician_view_snapshot", JSON.stringify(r.message));

//                 r.message.forEach(function (row) {
//                     let child = frm.add_child("repair_and_return");
//                     child.lot_no = row.lot_no;
//                     child.rma_id = row.rma_id || row.name;

//                     if (row.repaired_by) {
//                         child.assigned_to = row.repaired_by.includes(" - ") ? row.repaired_by.split(" - ")[0] : row.repaired_by;
//                         child.assigned_to_name = row.repaired_by;
//                         child.employee_name = row.repaired_by.split(' - ')[1];
//                     }

//                     child.assigned_date = row.rma_assigned_date;
//                     child.repaired_date = row.repaired_date;
//                     child.customer = row.customer;
//                     child.receiving_r = row.receiving_r || '';
//                     child.make = row.make;
//                     child.model_no = row.model_no;
//                     child.part_no = row.part_no;
//                     child.serial_no = row.serial_no;
//                     child.warranty_st = row.warranty_status;
//                     child.component_used = row.component_requested || row.requested_components || '';
//                     child.used_components = row.component_used_init || '';
//                     child.fault_found = row.fault_found;
//                     // child.repair_remarks = row.remarks && row.remarks.length > 0 ? row.remarks[row.remarks.length - 1]?.repair_remarks : '';
//                     child.repair_status = row.rma_id_status;
//                     child.material_receipt = row.material_request;
//                     child.material_issue = row.material_issue;
//                     child.is_modified = 0;

//                     if (!child.start_time) child.start_time = frappe.datetime.now_datetime();
//                     if (row.submitted_material_receipt) child.material_receipt = row.submitted_material_receipt;
//                     if (row.rma_assigned_date) child.assigned_date = row.rma_assigned_date;
//                     if (row.receiving_date) {
//                         child.receiving_date = row.receiving_date;
//                         child.tat = frappe.datetime.get_diff(frappe.datetime.get_today(), row.receiving_date);
//                     }
//                 });

//                 frm.refresh_field("repair_and_return");
//                 setTimeout(() => { format_components_as_pills(frm); }, 1000);

//                 frappe.show_alert({
//                     message: `Loaded ${r.message.length} RMA records for ${frm.doc.technician}${get_filter_info(frm)}`,
//                     indicator: 'green'
//                 });
//             } else {
//                 frappe.show_alert({
//                     message: `No RMA data found for technician: ${frm.doc.technician}${get_active_filters(frm)}`,
//                     indicator: 'orange'
//                 });
//             }
//         },
//         error: function (err) {
//             console.error("Error loading RMA data:", err);
//             frappe.show_alert({ message: 'Error loading RMA data', indicator: 'red' });
//         }
//     });
// }

// function get_active_filters_array(frm) {
//     let filters = [];
//     if (frm.doc.customer) filters.push(`Customer: ${frm.doc.customer}`);
//     if (frm.doc.lot_no) filters.push(`Lot No: ${frm.doc.lot_no}`);
//     if (frm.doc.warranty_status) filters.push(`Warranty: ${frm.doc.warranty_status}`);
//     if (frm.doc.circle) filters.push(`Circle: ${frm.doc.circle}`);
//     if (frm.doc.rma_id) filters.push(`RMA ID: ${frm.doc.rma_id}`);
//     if (frm.doc.repair_status) filters.push(`Status: ${frm.doc.repair_status}`);
//     return filters;
// }

// function get_filter_info(frm) {
//     let f = get_active_filters_array(frm);
//     return f.length ? ` (Filtered: ${f.join(', ')})` : '';
// }

// function get_active_filters(frm) {
//     let f = get_active_filters_array(frm);
//     return f.length ? ` with filters: ${f.join(', ')}` : '';
// }

// // =============================================================================
// // Child Table Event Handlers
// // =============================================================================
// frappe.ui.form.on("Repair and Return Tech View Table", {

//     select_items: function (frm, cdt, cdn) {
//         if (window._comp_dialog_open) return;
//         window._comp_dialog_open = true;
//         setTimeout(() => { window._comp_dialog_open = false; }, 2000);
//         trigger_select_components_dialog(frm, cdt, cdn, 'used_components', 'Add Used Components');
//     },

//     select_components: function (frm, cdt, cdn) {
//         if (window._comp_dialog_open) return;
//         window._comp_dialog_open = true;
//         setTimeout(() => { window._comp_dialog_open = false; }, 2000);
//         trigger_select_components_dialog(frm, cdt, cdn, 'component_used', 'Add Requested Components');
//     },

//     create_material_receipt: async function (frm, cdt, cdn) {
//         let row = locals[cdt][cdn];

//         if (!row.component_used) {
//             frappe.msgprint(__('Please select components first'));
//             return;
//         }

//         if (!row.rma_id) {
//             frappe.msgprint(__('RMA ID is required'));
//             return;
//         }

//         if (row.repair_status !== "Under Repair") {
//             frappe.throw({
//                 title: __('Status Validation Failed'),
//                 indicator: 'red',
//                 message: `<div style="text-align:center;padding:10px;">
//                     <div style="font-size:40px;color:#d9534f;margin-bottom:12px;">🚫</div>
//                     <h4 style="color:#333;margin-top:0;font-weight:600;">Request Rejected</h4>
//                     <p style="color:#555;font-size:13px;line-height:1.6;">
//                         Material transfers are only allowed when the repair status is set to <b>Under Repair</b>.
//                     </p>
//                     <p style="color:#777;font-size:12px;margin-top:8px;">
//                         Current Status:
//                         <span class="label label-danger" style="font-size:11px;">
//                             ${row.repair_status || 'Empty'}
//                         </span>
//                     </p>
//                 </div>`
//             });
//             return;
//         }

//         let parsed_items = parse_component_string(row.component_used);
//         if (!parsed_items.length) {
//             frappe.msgprint(__('No valid components found.'));
//             return;
//         }

//         let item_docs = await get_item_docs_by_codes(parsed_items.map(i => i.item_code));
//         if (!item_docs.length) {
//             frappe.msgprint(__('No valid Item docs found for selected components.'));
//             return;
//         }

//         try {
//             let doc = await frappe.db.get_doc('RMA BIN', row.rma_id);

//             // Deduplicate tracking/remarks updates
//             // safe_add_remark(doc, row.repair_remarks);
//             // safe_add_status_tracking(doc, row.repair_status);

//             if ('component_requested' in doc) doc.component_requested = row.component_used;
//             if ('requested_components' in doc) doc.requested_components = row.component_used;

//             doc.component_details = [];
//             parsed_items.forEach(item => {
//                 let resolved = item_docs.find(x => x.item_name === item.item_code || x.name === item.item_code);
//                 doc.component_details.push({
//                     doctype: "component_used",
//                     component_name: resolved ? resolved.name : item.item_code,
//                     qty: item.qty
//                 });
//             });

//             doc.fault_found = row.fault_found;
//             doc.repaired_date = row.assigned_date;
//             doc.rma_id_status = row.repair_status;

//             await frappe.call({
//                 method: 'frappe.client.save',
//                 args: { doc: doc }
//             });

//             let draft_entry = null;
//             let submitted_item_codes = [];

//             let stock_entries = await frappe.db.get_list('Stock Entry', {
//                 filters: { stock_entry_type: "Material Transfer" },
//                 fields: ["name", "custom_rma_id", "docstatus"]
//             });

//             for (let se of stock_entries) {
//                 if (!se.custom_rma_id) continue;
//                 let se_rmas = se.custom_rma_id.split(',').map(r => r.trim());
//                 if (!se_rmas.includes(row.rma_id)) continue;
//                 let se_doc = await frappe.db.get_doc("Stock Entry", se.name);
//                 if (se.docstatus === 0) { draft_entry = se_doc; break; }
//                 if (se.docstatus === 1) { se_doc.items.forEach(i => submitted_item_codes.push(i.item_code)); }
//             }

//             if (draft_entry) {
//                 let blocked = [...new Set([...draft_entry.items.map(i => i.item_code), ...submitted_item_codes])];
//                 let new_items = item_docs.filter(i => !blocked.includes(i.name));
//                 if (!new_items.length) { frappe.show_alert({ message: __('All selected components are already present in the existing draft or submitted entries.'), indicator: 'orange' }); return; }
//                 new_items.forEach(item => {
//                     let parsed = parsed_items.find(x => x.item_code === item.name || x.item_code === item.item_name);
//                     let q = parsed ? parsed.qty : 1;
//                     draft_entry.items.push({ item_code: item.name, item_name: item.item_name, description: item.description || item.item_name, uom: item.stock_uom || 'Nos', stock_uom: item.stock_uom || 'Nos', s_warehouse: draft_entry.from_warehouse, t_warehouse: draft_entry.to_warehouse, conversion_factor: 1, qty: q, transfer_qty: q, basic_rate: item.valuation_rate || 0 });
//                 });
//                 await frappe.call({ method: "frappe.client.save", args: { doc: draft_entry } });
//                 frappe.model.set_value(cdt, cdn, "material_receipt", draft_entry.name);
//                 await frappe.db.set_value("RMA BIN", row.rma_id, "material_request", draft_entry.name);
//                 frappe.show_alert({ message: __('New components added to existing Draft: ' + draft_entry.name), indicator: 'green' });
//                 setTimeout(function () { frappe.new_doc("Stock Entry", {}, function () { frappe.set_route("Form", "Stock Entry", draft_entry.name); }); }, 300);
//                 return;
//             }

//             let remaining = item_docs.filter(i => !submitted_item_codes.includes(i.name));
//             if (!remaining.length) { frappe.show_alert({ message: __('All selected components have already been requested in completed entries.'), indicator: 'orange' }); return; }
//             item_docs = remaining;

//             frappe.new_doc('Stock Entry', { stock_entry_type: 'Material Transfer', custom_technician: frm.doc.technician, purpose: "Material Transfer", custom_customer: row.customer, custom_rma_id: row.rma_id }, doc => {
//                 setTimeout(async () => {
//                     let se_frm = cur_frm;
//                     se_frm.doc.from_warehouse = "Ductus Technologies Pvt Ltd - DTPL";
//                     se_frm.doc.to_warehouse = "Repair Floor - DTPL";
//                     se_frm.clear_table('items');
//                     let res_data = await frappe.db.get_value('RMA', { 'name': frm.doc.lot_no }, 'warehouse');
//                     item_docs.forEach(function (item) {
//                         let parsed = parsed_items.find(x => x.item_code === item.name || x.item_code === item.item_name);
//                         let q = parsed ? parsed.qty : 1;
//                         let child = se_frm.add_child('items');
//                         child.item_code = item.name; child.item_name = item.item_name;
//                         child.description = item.description || item.item_name;
//                         child.uom = item.stock_uom || 'Nos'; child.stock_uom = item.stock_uom || 'Nos';
//                         child.s_warehouse = res_data?.message?.warehouse || 'Ductus Technologies Pvt Ltd - DTPL'; child.t_warehouse = 'Repair Floor - DTPL';
//                         child.conversion_factor = 1; child.qty = q; child.transfer_qty = q; child.basic_rate = item.valuation_rate || 0;
//                     });
//                     se_frm.refresh_field('items');
//                     frm.save();
//                     frappe.show_alert({ message: __('Material Transfer created with ' + item_docs.length + ' components for RMA: ' + row.rma_id), indicator: 'blue' });
//                 }, 500);
//             });

//         } catch (e) {
//             console.error("create_material_receipt failed", e);
//             frappe.msgprint({
//                 title: __("Error"),
//                 indicator: "red",
//                 message: e.message || __("Unable to create Material Transfer / update RMA BIN")
//             });
//         }
//     },

//     refresh: function (frm) {
//         setup_field_filters(frm);
//         setTimeout(() => {
//             let $h1 = frm.fields_dict.repair_and_return.grid.wrapper.find('.grid-heading-row [data-fieldname="component_used"]');
//             if ($h1.length) $h1.html('Component Used');
//             let $h2 = frm.fields_dict.repair_and_return.grid.wrapper.find('.grid-heading-row [data-fieldname="used_components"]');
//             if ($h2.length) $h2.html('Used Components');
//             format_components_as_pills(frm);
//         }, 500);
//     },

//     assigned_to: function (frm, cdt, cdn) {
//         let row = locals[cdt][cdn];
//         if (row.assigned_to) {
//             frappe.db.get_doc('Employee', row.assigned_to)
//                 .then(item => { frappe.model.set_value(cdt, cdn, 'employee_name', item.employee_name); })
//                 .catch(() => { frappe.model.set_value(cdt, cdn, 'employee_name', ''); });
//         }
//     },

//     view_remarks: async function (frm, cdt, cdn) {
//         let row = locals[cdt][cdn];
//         if (!row.rma_id) { frappe.msgprint("RMA ID not found."); return; }
//         try {
//             let rmaDoc = await frappe.db.get_doc("RMA BIN", row.rma_id);
//             let remarks_html = "";
//             if (rmaDoc.remarks && rmaDoc.remarks.length > 0) {
//                 rmaDoc.remarks.slice().reverse().forEach(function (r) {
//                     remarks_html += `<div style="padding:12px;margin-bottom:10px;border:1px solid #e3e3e3;border-radius:8px;background:#fafafa;"><div style="display:flex;justify-content:space-between;font-size:12px;color:#6c757d;margin-bottom:6px;"><span>👤 ${r.modified_by || r.owner || "System"}</span><span>🕒 ${r.timestamp || ""}</span></div><div style="font-size:14px;color:#333;">${r.repair_remarks || ""}</div></div>`;
//                 });
//             } else {
//                 remarks_html = "<p>No previous remarks found.</p>";
//             }
//             let d = new frappe.ui.Dialog({ title: "Previous Remarks - " + row.rma_id, size: "large", fields: [{ fieldtype: "HTML", fieldname: "remarks_content" }] });
//             d.fields_dict.remarks_content.$wrapper.html(remarks_html);
//             d.show();
//         } catch (err) {
//             console.error("Error fetching remarks:", err);
//             frappe.msgprint("Unable to load remarks.");
//         }
//     },

//     repair_status: function (frm, cdt, cdn) { locals[cdt][cdn].is_modified = 1; },
//     repair_remarks: function (frm, cdt, cdn) { locals[cdt][cdn].is_modified = 1; },
//     component_used: function (frm, cdt, cdn) {
//         locals[cdt][cdn].is_modified = 1;
//         format_components_as_pills(frm);
//     },
//     used_components: function (frm, cdt, cdn) {
//         locals[cdt][cdn].is_modified = 1;
//         format_components_as_pills(frm);
//     },
//     fault_found: function (frm, cdt, cdn) { locals[cdt][cdn].is_modified = 1; },
//     serial_no: function (frm, cdt, cdn) { locals[cdt][cdn].is_modified = 1; }
// });

// frappe.form.link_formatters['Employee'] = function (value, doc) {
//     if (doc && doc.employee_name && doc.employee_name !== value) {
//         return value + " - " + doc.employee_name;
//     }
//     return value;
// };



















function calculate_tat(start_time, end_time) {
    if (!start_time || !end_time) return null;
    try {
        const startDate = new Date(start_time);
        const endDate = new Date(end_time);
        const diffMs = endDate - startDate;
        const totalSeconds = Math.floor(diffMs / 1000);
        const hours = Math.floor(totalSeconds / 3600);
        const minutes = Math.floor((totalSeconds % 3600) / 60);
        const seconds = totalSeconds % 60;
        return `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
    } catch (err) {
        console.error("Error calculating TAT:", err);
        return null;
    }
}
// Helper functions for item parsing and safe batch resolution

function parse_component_string(component_string) {
    let items = [];
    (component_string || "")
        .split(",")
        .map(s => s.trim())
        .filter(Boolean)
        .forEach(entry => {
            let qty = 1;
            let item_code = entry;

            let m = entry.match(/\[Qty:(\d+)\]$/);
            if (m) {
                qty = parseInt(m[1]);
                item_code = entry.replace(/\s*\[Qty:\d+\]$/, '').trim();
            }

            items.push({
                item_code: item_code,
                qty: qty
            });
        });

    return items;
}

// Robust batch lookup using get_items_by_partial_name to prevent DoesNotExist errors
async function get_item_docs_by_codes(item_codes) {
    if (!item_codes || item_codes.length === 0) return [];
    try {
        let res = await frappe.call({
            method: "rms.rms.doctype.repair_and_return_technician_view.repair_and_return_technician_view.get_items_by_partial_name",
            args: { item_names: item_codes }
        });
        return res.message || [];
    } catch (e) {
        console.error("Item batch fetch failed:", e);
        return [];
    }
}

// Deduplication Helper: Safely appends remarks avoiding repeated entries
function safe_add_remark(doc, repair_remarks) {
    if (!repair_remarks || !repair_remarks.trim()) return false;
    let normalized_new = repair_remarks.trim();
    let last_remark = "";
    if (doc.remarks && doc.remarks.length > 0) {
        last_remark = (doc.remarks[doc.remarks.length - 1].repair_remarks || "").trim();
    } else {
        last_remark = (doc.repair_remarks || "").trim();
    }
    if (normalized_new !== last_remark) {
        doc.remarks = doc.remarks || [];
        doc.remarks.push({
            repair_remarks: normalized_new,
            timestamp: frappe.datetime.now_datetime()
        });
        doc.repair_remarks = normalized_new;
        return true;
    }
    return false;
}

// Deduplication Helper: Safely appends repair statuses avoiding duplicates
function safe_add_status_tracking(doc, repair_status) {
    if (!repair_status || !repair_status.trim()) return false;
    let normalized_status = repair_status.trim();
    let last_status = "";
    if (doc.rma_status && doc.rma_status.length > 0) {
        last_status = (doc.rma_status[doc.rma_status.length - 1].repair_status || "").trim();
    } else {
        last_status = (doc.repair_status || "").trim();
    }
    if (normalized_status !== last_status) {
        doc.rma_status = doc.rma_status || [];
        doc.rma_status.push({
            repair_status: normalized_status,
            timestamp: frappe.datetime.now_datetime()
        });
        doc.repair_status = normalized_status;
        doc.rma_id_status = normalized_status;
        return true;
    }
    return false;
}

// Deduplication Helper: Safely records technician assignment history
function safe_add_tracking_history(doc, status_type, remarks_text, rma_status_val) {
    doc.rma_tracking_status = doc.rma_tracking_status || [];
    let is_duplicate = doc.rma_tracking_status.some(entry =>

        (entry.status || "").trim() === status_type &&
        (entry.rma_status || "").trim() === (rma_status_val || "").trim() &&        
        (entry.remarks || "").trim() === remarks_text.trim()

    );
    if (!is_duplicate) {
        doc.rma_tracking_status.push({
            status: status_type,
            timestamp: frappe.datetime.now_datetime(),
            modified_by1: frappe.session.user,
            remarks: remarks_text,
            rma_status: rma_status_val
        });
        return true;
    }
    return false;
}

function inject_pill_directly(frm, cdn, field, value, color, btn_class) {
    if (!value || !value.trim()) return;
    if (!frm.fields_dict.repair_and_return || !frm.fields_dict.repair_and_return.grid) return;

    let btnClass = btn_class || (field === 'used_components' ? 'view-used-components-btn' : 'view-components-btn');
    let btnColor = color || (field === 'used_components' ? '#2dce89' : '#5e72e4');

    let $gridRow = frm.fields_dict.repair_and_return.grid.wrapper
        .find('.grid-row[data-name="' + cdn + '"]');

    if (!$gridRow.length) {
        frm.fields_dict.repair_and_return.grid.wrapper
            .find('.grid-row').each(function () {
                let idx = $(this).attr('data-idx');
                if (!idx) return;
                let rowIndex = parseInt(idx) - 1;
                let doc = (frm.doc.repair_and_return || [])[rowIndex];
                if (doc && doc.name === cdn) {
                    $gridRow = $(this);
                    return false; // break
                }
            });
    }

    if (!$gridRow.length) return;

    let $cell = $gridRow.find('[data-fieldname="' + field + '"]');
    if (!$cell.length) return;

    let rowIdx = $gridRow.attr('data-idx');
    let actualRowIndex = rowIdx ? parseInt(rowIdx) - 1 : 0;

    let btn = `
        <div style="width:100%;display:flex;justify-content:center;align-items:center;">
            <button class="btn btn-xs ${btnClass}" data-row-idx="${actualRowIndex}"
                style="font-size:11px;padding:3px 12px;border-radius:12px;background:${btnColor};color:#fff;border:none;cursor:pointer;">
                View
            </button>
        </div>`;

    $cell.html(btn).css({
        "display": "flex",
        "justify-content": "center",
        "align-items": "center",
        "text-align": "center"
    });
}

frappe.ui.form.on('Repair and Return Technician View', {
    refresh: async function (frm) {

        frm.set_query("repair_status", "repair_and_return", function () {
            return { filters: { "repair_and_return_tech_view": 1 } };
        });

        if (frm.custom_buttons["Get Data"]) {
            frm.remove_custom_button("Get Data");
        }

        frm.add_custom_button(__('Get Data'), function () {
            load_technician_rma_data(frm);
        }).addClass('btn-primary');

        frm.remove_custom_button(__('Create Material Request'));

        if (!frm.doc.repair_and_return || !frm.doc.repair_and_return.length) return;

        let rma_ids = frm.doc.repair_and_return
            .map(row => (row.rma_id || '').trim())
            .filter(rma => rma);

        if (!rma_ids.length) return;

        let stock_entries = await frappe.db.get_list('Stock Entry', {
            filters: { stock_entry_type: "Material Transfer" },
            fields: ["name", "custom_rma_id"]
        });

        let material_transfer_exists = false;
        for (let se of stock_entries) {
            if (!se.custom_rma_id) continue;
            let se_rmas = se.custom_rma_id.split(',').map(r => r.trim());
            if (rma_ids.some(rma => se_rmas.includes(rma))) {
                material_transfer_exists = true;
                break;
            }
        }

        if (!material_transfer_exists) {
            frm.add_custom_button(__('Create Material Request'), async function () {

                let items_with_components = frm.doc.repair_and_return.filter(item =>
                    item.component_used && item.component_used.trim() !== ''
                );

                if (items_with_components.length === 0) {
                    frappe.msgprint(__('No items found with components'));
                    return;
                }

                let invalid_status_items = items_with_components.filter(item => item.repair_status !== 'Under Repair');
                if (invalid_status_items.length > 0) {
                    let invalid_rmas = invalid_status_items.map(item => `<b>${item.rma_id}</b> (${item.repair_status || 'Not Set'})`).join('<br>');
                    frappe.throw({
                        title: __('Repair Status Error'),
                        indicator: 'red',
                        message: `<div style="padding:5px;"><p style="font-size:14px;color:#333;">Material requests can only be created for items currently in <b>Under Repair</b> status.</p><p style="font-size:13px;color:#d9534f;font-weight:bold;margin-top:10px;">Please update the status for the following RMA records first:</p><div style="background:#fdf7f7;border-left:4px solid #d9534f;padding:10px;margin-top:5px;font-family:monospace;">${invalid_rmas}</div></div>`
                    });
                    return;
                }

                let rma_ids_list = items_with_components.map(item => item.rma_id).join(', ');
                let components = [];
                let qty_map = {};

                for (let row of items_with_components) {
                    let parsed_items = parse_component_string(row.component_used);
                    let item_docs = await get_item_docs_by_codes(parsed_items.map(i => i.item_code));

                    parsed_items.forEach(item => {
                        let resolved_doc = item_docs.find(doc => doc.name === item.item_code || doc.item_name === item.item_code);
                        let resolved_code = resolved_doc ? resolved_doc.name : item.item_code;

                        components.push(resolved_code);
                        qty_map[resolved_code] = (qty_map[resolved_code] || 0) + item.qty;
                    });

                    try {
                        let doc = await frappe.db.get_doc('RMA BIN', row.rma_id);

                        if ('component_requested' in doc) doc.component_requested = row.component_used;
                        if ('requested_components' in doc) doc.requested_components = row.component_used;

                        doc.component_details = [];
                        parsed_items.forEach(item => {
                            let resolved_doc = item_docs.find(doc => doc.name === item.item_code || doc.item_name === item.item_code);
                            let resolved_code = resolved_doc ? resolved_doc.name : item.item_code;

                            doc.component_details.push({
                                doctype: "component_used",
                                component_name: resolved_code,
                                qty: item.qty
                            });
                        });
                        doc.fault_found = row.fault_found;
                        doc.repaired_date = row.assigned_date;
                        doc.rma_id_status = row.repair_status;
                        await frappe.call({
                            method: 'frappe.client.save',
                            args: { doc: doc }
                        });
                        frappe.show_alert({ message: __('Requested components saved for: ' + row.rma_id), indicator: 'green' });
                    } catch (err) {
                        console.error("Failed to update RMA BIN database:", err);
                    }
                }

                components = [...new Set(components)];
                let item_docs = await get_item_docs_by_codes(components);

                if (!item_docs.length) {
                    frappe.msgprint(__('Could not fetch component details'));
                    return;
                }

                let draft_entry = null;
                let submitted_item_codes = [];

                let stock_entries = await frappe.db.get_list('Stock Entry', {
                    filters: { stock_entry_type: "Material Transfer" },
                    fields: ["name", "custom_rma_id", "docstatus"]
                });

                for (let se of stock_entries) {
                    if (!se.custom_rma_id) continue;
                    let se_rmas = se.custom_rma_id.split(',').map(r => r.trim());
                    let current_rmas = rma_ids_list.split(',').map(r => r.trim());
                    if (!current_rmas.some(r => se_rmas.includes(r))) continue;
                    let se_doc = await frappe.db.get_doc("Stock Entry", se.name);
                    if (se.docstatus === 0) { draft_entry = se_doc; break; }
                    if (se.docstatus === 1) { se_doc.items.forEach(i => submitted_item_codes.push(i.item_code)); }
                }

                if (draft_entry) {
                    let blocked = [...new Set([...draft_entry.items.map(i => i.item_code), ...submitted_item_codes])];
                    let new_items = item_docs.filter(i => !blocked.includes(i.name));
                    if (!new_items.length) { frappe.show_alert({ message: __('All selected components are already present in the existing draft or submitted entries.'), indicator: 'orange' }); return; }
                    new_items.forEach(item => {
                        let parsed = parsed_items.find(x => x.item_code === item.name || x.item_code === item.item_name);
                        let q = parsed ? parsed.qty : (qty_map[item.name] || 1);
                        draft_entry.items.push({ item_code: item.name, item_name: item.item_name, description: item.description || item.item_name, uom: item.stock_uom || 'Nos', stock_uom: item.stock_uom || 'Nos', s_warehouse: draft_entry.from_warehouse, t_warehouse: draft_entry.to_warehouse, conversion_factor: 1, qty: q, transfer_qty: q, basic_rate: item.valuation_rate || 0 });
                    });
                    await frappe.call({ method: "frappe.client.save", args: { doc: draft_entry } });
                    frappe.show_alert({ message: __('New components added to Draft: ' + draft_entry.name), indicator: 'green' });
                    frappe.set_route("Form", "Stock Entry", draft_entry.name);
                    return;
                }

                let remaining = item_docs.filter(i => !submitted_item_codes.includes(i.name));
                if (!remaining.length) { frappe.show_alert({ message: __('All selected components have already been requested in completed entries.'), indicator: 'orange' }); return; }
                item_docs = remaining;

                frappe.new_doc('Stock Entry', { stock_entry_type: 'Material Transfer', custom_technician: frm.doc.technician, purpose: 'Material Transfer', custom_customer: items_with_components[0].customer, custom_rma_id: rma_ids_list }, doc => {
                    setTimeout(async () => {
                        let se_frm = cur_frm;
                        se_frm.doc.from_warehouse = "Ductus Technologies Pvt Ltd - DTPL";
                        se_frm.doc.to_warehouse = "Repair Floor - DTPL";
                        se_frm.clear_table('items');
                        let res_data = await frappe.db.get_value('RMA', { 'name': frm.doc.lot_no }, 'warehouse');
                        item_docs.forEach(function (item) {
                            let q = qty_map[item.name] || 1;
                            let row = se_frm.add_child('items');
                            row.item_code = item.name; row.item_name = item.item_name;
                            row.description = item.description || item.item_name;
                            row.uom = item.stock_uom || 'Nos'; row.stock_uom = item.stock_uom || 'Nos';
                            row.s_warehouse = res_data?.message?.warehouse || 'Ductus Technologies Pvt Ltd - DTPL'; row.t_warehouse = 'Repair Floor - DTPL';
                            row.conversion_factor = 1; row.qty = q; row.transfer_qty = q; row.basic_rate = item.valuation_rate || 0;
                        });
                        se_frm.refresh_field('items');
                        frappe.show_alert({ message: __('Material Transfer created with ' + item_docs.length + ' components.'), indicator: 'blue' });
                    }, 500);
                });
            }).addClass('btn-primary');
        }

        setup_field_filters(frm);
        setTimeout(() => { format_components_as_pills(frm); }, 1000);
    },

    customer: function (frm) {
        if (frm.doc.lot_no) frm.set_value('lot_no', '');
    },

    onload_post_render: function (frm) {
        set_current_technician(frm);
        frm.set_value("lot_no", "");
        frm.set_value("customer", "");
        frm.set_value("circle", "");
        frm.set_value("warranty_status", "");
        frm.clear_table("repair_and_return");
        frm.refresh_field("repair_and_return");
    },

    validate: async function (frm) {
        let oldData = [];
        try {
            oldData = JSON.parse(localStorage.getItem("repair_and_return_technician_view_snapshot") || "[]");
        } catch (e) {
            console.error("Error loading snapshot", e);
        }

        for (let row of frm.doc.repair_and_return || []) {

            // Skip untouched rows completely
            if (row.is_modified !== 1) {
                continue;
            }

            // If this row was modified, Repair Status is compulsory
            if (!row.repair_status || !String(row.repair_status).trim()) {
                frappe.throw({
                    title: __('Repair Status Missing'),
                    indicator: 'red',
                    message: __(
                        `Repair Status is mandatory for RMA ID <b>${row.rma_id || ''}</b> because this row was modified.`
                    )
                });
            }

            let original = oldData.find(o => o.rma_id === row.rma_id);

            if (original) {
                const normalize = val => (val === undefined || val === null) ? "" : String(val).trim();
                let orig_status = normalize(original.repair_status || original.rma_id_status);
                let curr_status = normalize(row.repair_status);

                let orig_remarks = "";
                if (original.remarks && original.remarks.length > 0) {
                    orig_remarks = normalize(original.remarks[original.remarks.length - 1]?.repair_remarks);
                } else {
                    orig_remarks = normalize(original.repair_remarks);
                }

                let orig_components = normalize(original.component_requested || original.requested_components || original.component_used);
                let curr_components = normalize(row.component_used);
                let orig_used = normalize(original.component_used_init);
                let curr_used = normalize(row.used_components);

                if (orig_status !== "Under Repair" && curr_status !== "Under Repair") {
                    if (
                        orig_status !== curr_status ||
                        normalize(row.repair_remarks) !== orig_remarks ||
                        curr_components !== orig_components ||
                        curr_used !== orig_used
                    ) {
                        frappe.throw({
                            title: __('Repair Status Error'),
                            indicator: 'orange',
                            message: `<div style="text-align:center;padding:10px;">
                            <div style="font-size:40px;color:#f39c12;margin-bottom:12px;">⚠️</div>
                            <h4 style="color:#333;margin-top:0;font-weight:600;">Repair Status Required</h4>
                            <p style="color:#555;font-size:13px;line-height:1.6;">
                                To start repairs, add components, write remarks, or update status for RMA:
                                <br><strong style="color:#000;">${row.rma_id}</strong>,
                                <br>You must first set the Repair Status to
                                <span class="label label-warning" style="font-size:11px;padding:2px 6px;"><b>Under Repair</b></span>
                            </p>
                        </div>`
                        });
                        return false;
                    }
                }
            }

            if (!row.start_time) {
                frappe.throw({
                    title: __('Start Time Missing'),
                    message: __('Start Time is required for RMA ID: <b>' + row.rma_id + '</b><br>Please click "Get Data" button first to populate Start Time.'),
                    indicator: 'red'
                });
                return false;
            }

            if (!row.end_time) row.end_time = frappe.datetime.now_datetime();

            if (row.start_time && row.end_time) {
                const tat_value = calculate_tat(row.start_time, row.end_time);
                row.tat = tat_value;
                row.total_tat = tat_value;
            }
        }

        frm.refresh_field("repair_and_return");
    },

    // =============================================================================
    // before_save: Prepares modifications locally.
    // Queue RMA BIN changes to execute safely inside after_save.
    // =============================================================================
    before_save: function (frm) {
        frm.rmas_to_trigger_material_issue = []; // Safe persistent registry that survives document reloads
        return new Promise(async (resolve, reject) => {
            try {
                let oldData = JSON.parse(localStorage.getItem("repair_and_return_technician_view_snapshot") || "[]");
                let local_storage_val = [];
                frm.rma_docs_to_save = []; // Initialize database queue for after_save

                for (let row of (frm.doc.repair_and_return || [])) {
                    let original = oldData.find(o => o.rma_id === row.rma_id);

                    function normalize(val) {
                        return (val === undefined || val === null) ? "" : String(val).trim();
                    }

                    // Strict comparison tracking to prevent redundant updates
                    let currentStatus = normalize(row.repair_status);
                    let currentRemarks = normalize(row.repair_remarks);
                    let currentComponents = normalize(row.component_used);
                    let currentUsedComponents = normalize(row.used_components);
                    let currentFaultFound = normalize(row.fault_found);
                    let currentSerialNo = normalize(row.serial_no);
                    let currentAssignedDate = normalize(row.assigned_date);

                    let origStatus = original ? normalize(original.rma_id_status || original.repair_status) : '';
                    let origRemarks = "";
                    if (original && original.remarks && original.remarks.length > 0) {
                        origRemarks = normalize(original.remarks[original.remarks.length - 1]?.repair_remarks);
                    } else if (original) {
                        origRemarks = normalize(original.repair_remarks);
                    }
                    let origComponents = original ? normalize(original.component_requested || original.requested_components || original.component_used) : '';
                    let origUsedComponents = original ? normalize(original.component_used_init) : '';
                    let origFaultFound = original ? normalize(original.fault_found) : '';
                    let origSerialNo = original ? normalize(original.serial_no) : '';
                    let origAssignedDate = original ? normalize(original.repaired_date) : '';

                    let statusChanged = currentStatus !== origStatus;
                    let remarksChanged = currentRemarks !== origRemarks && currentRemarks !== "";
                    let componentsChanged = currentComponents !== origComponents;
                    let usedComponentsChanged = currentUsedComponents !== origUsedComponents;
                    let faultFoundChanged = currentFaultFound !== origFaultFound;
                    let serialNoChanged = currentSerialNo !== origSerialNo;
                    let assignedDateChanged = currentAssignedDate !== origAssignedDate;

                    let hasAnyChange = statusChanged || remarksChanged || componentsChanged || usedComponentsChanged || faultFoundChanged || serialNoChanged || assignedDateChanged;

                    if (hasAnyChange) {
                        console.log("Preparing RMA BIN update parameters for:", row.rma_id);

                        let rmaDoc = await frappe.db.get_doc("RMA BIN", row.rma_id);
                        let docChanged = false;

                        // 1. repaired_date
                        if (assignedDateChanged) {
                            rmaDoc.repaired_date = row.assigned_date;
                            docChanged = true;
                        }

                        // 2. start/end repair times
                        if (original && original.repair_and_return_start_time) {
                            if (!original.repair_and_return_end_time && row.repair_status !== "Under Repair") {
                                rmaDoc.repair_and_return_end_time = frappe.datetime.now_datetime();
                                rmaDoc.total_repair_time = calculate_tat(original.repair_and_return_start_time, rmaDoc.repair_and_return_end_time);
                                docChanged = true;
                            }
                        } else if (row.repair_status === "Under Repair") {
                            rmaDoc.repair_and_return_start_time = frappe.datetime.now_datetime();
                            docChanged = true;
                        }

                        // 3. fault_found
                        if (faultFoundChanged) {
                            rmaDoc.fault_found = row.fault_found;
                            docChanged = true;
                        }

                        // 4. Requested Components
                        if (componentsChanged) {
                            rmaDoc.component_requested = row.component_used;
                            rmaDoc.requested_components = row.component_used;
                            docChanged = true;

                            rmaDoc.component_details = [];

                            let parsed_items = parse_component_string(row.component_used);
                            let item_docs = await get_item_docs_by_codes(parsed_items.map(i => i.item_code));

                            parsed_items.forEach(item => {
                                let resolved_doc = item_docs.find(doc => doc.name === item.item_code || doc.item_name === item.item_code);
                                let resolved_code = resolved_doc ? resolved_doc.name : item.item_code;

                                rmaDoc.component_details.push({
                                    doctype: "component_used",
                                    component_name: resolved_code,
                                    qty: item.qty
                                });
                            });
                        }

                        // 5. Used Components
                        if (usedComponentsChanged) {
                            rmaDoc.component_used_init = row.used_components;
                            docChanged = true;
                        }

                        // 6. repair_status (using deduplicated tracker helper)
                        if (statusChanged) {

                            let addedStatus = safe_add_status_tracking(rmaDoc, row.repair_status);

                            if (addedStatus)
                                docChanged = true;

                            let addedTrack = safe_add_tracking_history(
                                rmaDoc,
                                "RMA Technician Update",
                                "Repair Status Updated to " + row.repair_status,
                                row.repair_status
                            );

                            if (addedTrack)
                                docChanged = true;
                        }


                        // 7. repair_remarks (using deduplicated helper to completely avoid repeats)
                        if (remarksChanged) {
                            let addedRemark = safe_add_remark(rmaDoc, row.repair_remarks);
                            if (addedRemark) docChanged = true;
                        }

                        // 9. serial_no
                        if (serialNoChanged) {
                            rmaDoc.serial_no = row.serial_no;
                            docChanged = true;
                        }

                        // Material Issue trigger flag
                        row.trigger_material_issue = 0;

                        let currentStatus = normalize(row.repair_status);
                        let previousStatus = normalize(original?.rma_id_status);

                        if (
                            original &&
                            (
                                currentStatus === "Repaired & Ready for Quality check" ||
                                currentStatus === "Scrap"
                            ) &&
                            currentStatus !== previousStatus
                        ) {
                            row.trigger_material_issue = 1;
                            frm.rmas_to_trigger_material_issue.push(row.rma_id);
                        }

                        // Stock validation for each requested component before allowing finished status
                        if ((row.repair_status === "Repaired & Ready for Quality check" || row.repair_status === "Scrap") &&
                            row.component_used &&
                            !row.material_issue) {
                    
                            let parsed_items = parse_component_string(row.component_used);
                            let item_docs = await get_item_docs_by_codes(parsed_items.map(i => i.item_code));

                            for (let item of parsed_items) {
                                let resolved_doc = item_docs.find(doc => doc.name === item.item_code || doc.item_name === item.item_code);
                                let resolved_code = resolved_doc ? resolved_doc.name : item.item_code;

                                await frappe.call({
                                    method: "rms.rms.doctype.repair_and_return_technician_view.repair_and_return_technician_view.validate_component_stock",
                                    args: {
                                        item_code: resolved_code,
                                        warehouse: "Repair Floor - DTPL",
                                        qty: item.qty
                                    }
                                });
                            }
                        }

                        if (docChanged) {
                            frm.rma_docs_to_save.push({
                                rma_id: row.rma_id,
                                doc: rmaDoc
                            });
                        } else {
                            local_storage_val.push(rmaDoc);
                        }
                    } else {
                        if (original) {
                            local_storage_val.push(original);
                        } else {
                            let rmaDoc = await frappe.db.get_doc("RMA BIN", row.rma_id);
                            local_storage_val.push(rmaDoc);

                        }
                    }
                }
                resolve(); // Moved outside the for loop to run successfully only after all rows finish processing
            } catch (err) {
                console.error("Error preparing RMA BIN docs:", err);
                frappe.msgprint({ title: __("Save Failed"), message: __("An error occurred while preparing RMA BIN records. Please check the console log."), indicator: "red" });
                reject(err);
            }
        });
    },

    // =============================================================================
    // after_save: Saves queued RMA BIN records to the database.
    // Triggers material issue generation once standard save confirms.
    // =============================================================================
    after_save: async function (frm) {
        // 1. Database execution of queued RMA BIN updates
        if (frm.rma_docs_to_save && frm.rma_docs_to_save.length > 0) {
            let local_storage_val = [];
            try {
                let oldData = JSON.parse(localStorage.getItem("repair_and_return_technician_view_snapshot") || "[]");

                for (let item of frm.rma_docs_to_save) {
                    console.log("Saving RMA BIN in after_save:", item.rma_id);
                    let savedDoc;
                    try {
                        savedDoc = await frappe.call({
                            method: "frappe.client.save",
                            args: { doc: item.doc }
                        });
                    } catch (saveErr) {
                        console.error(`Failed saving RMA BIN ${item.rma_id} in after_save:`, saveErr);
                        frappe.msgprint({
                            title: __('RMA BIN Save Failed'),
                            indicator: 'red',
                            message: __(`Could not save RMA BIN ${item.rma_id}. Check console for details.`)
                        });
                        throw saveErr;
                    }

                    let doc_msg = savedDoc.message;

                    // Rebuild component_requested string for snapshot
                    let req_msg = '';
                    if (doc_msg.component_details && doc_msg.component_details.length > 0) {
                        req_msg = doc_msg.component_details.map(d => `${d.component_name || d.item_code || ''} [Qty:${d.qty || 1}]`).join(', ');
                    } else {
                        req_msg = doc_msg.requested_components || doc_msg.component_requested || '';
                    }
                    doc_msg.component_requested = req_msg;
                    doc_msg.requested_components = req_msg;
                    doc_msg.component_used = req_msg;

                    // Preserve component_used_init
                    if (!doc_msg.component_used_init && item.doc.component_used_init) {
                        doc_msg.component_used_init = item.doc.component_used_init;
                    }

                    local_storage_val.push(doc_msg);
                    frappe.show_alert({ message: __(`Updated ${item.rma_id} successfully.`), indicator: 'green' }, 5);
                }

                // Merge updated records with unmodified snapshot records
                let merged_storage = [...local_storage_val];
                oldData.forEach(old_row => {
                    if (!merged_storage.some(m => m.name === old_row.name || m.rma_id === old_row.rma_id)) {
                        merged_storage.push(old_row);
                    }
                });

                localStorage.setItem("repair_and_return_technician_view_snapshot", JSON.stringify(merged_storage));

            } catch (err) {
                console.error("Error saving RMA BIN docs in after_save:", err);
                frappe.msgprint({ title: __("Save Failed"), message: __("An error occurred while saving RMA BIN records in after_save. Please check the console log."), indicator: "red" });
                return;
            } finally {
                frm.rma_docs_to_save = []; // Clear local processing queue
            }
        }

        // 2. Process finished lines for automatic Material Issue creation (Using Used Components)
        let rows_to_process = (frm.doc.repair_and_return || []).filter(row =>
            (row.trigger_material_issue == 1 || (frm.rmas_to_trigger_material_issue && frm.rmas_to_trigger_material_issue.includes(row.rma_id))) &&
            row.used_components &&
            !row.material_issue
        );

        async function process_row(index) {
            if (index >= rows_to_process.length) {
                load_technician_rma_data(frm);
                return;
            }

            let row = rows_to_process[index];
            try {
                // Parse the "Used Components" field
                let parsed_items = parse_component_string(row.used_components);
                if (!parsed_items.length) { await process_row(index + 1); return; }

                let item_docs = await get_item_docs_by_codes(parsed_items.map(i => i.item_code));
                if (!item_docs.length) { await process_row(index + 1); return; }

                let stock_entry = {
                    doctype: "Stock Entry",
                    stock_entry_type: "Material Issue",
                    purpose: "Material Issue",
                    custom_customer: row.customer,
                    custom_rma_id: row.rma_id,
                    items: []
                };

                item_docs.forEach(item_doc => {
                    let parsed = parsed_items.find(x => x.item_code === item_doc.name || x.item_code === item_doc.item_name);
                    stock_entry.items.push({
                        item_code: item_doc.name,
                        item_name: item_doc.item_name,
                        description: item_doc.description || item_doc.item_name,
                        s_warehouse: "Repair Floor - DTPL",
                        cost_center: "Repair Floor - DTPL",
                        qty: parsed ? parsed.qty : 1
                    });
                });

                let r = await frappe.call({
                    method: "rms.rms.doctype.repair_and_return_technician_view.repair_and_return_technician_view.create_material_issue",
                    args: { 
                        stock_entry_data: stock_entry,
                        child_doctype: row.doctype,
                        child_name: row.name,
                        rma_id: row.rma_id
                    },
                    freeze: true, freeze_message: __("Creating Material Issue...")
                });

                if (r.message && r.message.stock_error) {
                    frappe.msgprint({ title: __("Insufficient Stock"), indicator: "red", message: r.message.error });
                }
                else if (r.message && r.message.success) {

                    // Update child table locally in UI memory so it displays immediately
                    await frappe.model.set_value(
                        row.doctype,
                        row.name,
                        "material_issue",
                        r.message.stock_entry
                    );

                    frappe.show_alert({
                        message: __("Material Issue Created & Submitted: " + r.message.stock_entry),
                        indicator: "green"
                    });
                }
                else {
                    frappe.msgprint({ title: __("Error"), indicator: "red", message: r.message?.error || __("Unable to create Material Issue") });
                }

                // let r = await frappe.call({
                //     method: "rms.rms.doctype.repair_and_return_technician_view.repair_and_return_technician_view.create_material_issue",
                //     args: { stock_entry_data: stock_entry },
                //     freeze: true, freeze_message: __("Creating Material Issue...")
                // });

                // if (r.message && r.message.stock_error) {
                //     frappe.msgprint({ title: __("Insufficient Stock"), indicator: "red", message: r.message.error });
                // }
                // else if (r.message && r.message.success) {

                //     // Update child table
                //     await frappe.model.set_value(
                //         row.doctype,
                //         row.name,
                //         "material_issue",
                //         r.message.stock_entry
                //     );

                //     // Update RMA BIN
                //     await frappe.db.set_value(
                //         "RMA BIN",
                //         row.rma_id,
                //         "material_issue",
                //         r.message.stock_entry
                //     );

                //     frappe.show_alert({
                //         message: __("Material Issue Created & Submitted: " + r.message.stock_entry),
                //         indicator: "green"
                //     });
                // }
                // else {
                //     frappe.msgprint({ title: __("Error"), indicator: "red", message: r.message?.error || __("Unable to create Material Issue") });
                // }

            } catch (e) {
                console.error("after_save material issue failed", e);
                frappe.msgprint({ title: __("Error"), indicator: "red", message: e.message || __("Unable to create Material Issue") });
            }

            await process_row(index + 1);
            console.log({
                rma: row.rma_id,
                status: row.repair_status,
                trigger: row.trigger_material_issue,
                used: row.used_components,
                material_issue: row.material_issue
            });
        }

        await process_row(0);
    }
});

function format_components_as_pills(frm) {
    if (!frm.fields_dict.repair_and_return || !frm.fields_dict.repair_and_return.grid) return;

    // --- Requested Components (component_used) ---
    frm.fields_dict.repair_and_return.grid.wrapper
        .find('[data-fieldname="component_used"]').each(function () {
            let $cell = $(this);
            if ($cell.closest('.grid-heading-row').length > 0) return;
            let rowIndex = parseInt($cell.closest('.grid-row').attr('data-idx') || '0') - 1;
            if (rowIndex < 0 || rowIndex >= (frm.doc.repair_and_return || []).length) return;

            let rowData = frm.doc.repair_and_return[rowIndex];
            let val = rowData.component_used || '';

            if (val.trim()) {
                $cell.html(`<div style="width:100%;display:flex;justify-content:center;align-items:center;"><button class="btn btn-xs view-components-btn" data-row-idx="${rowIndex}" style="font-size:11px;padding:3px 12px;border-radius:12px;background:#5e72e4;color:#fff;border:none;cursor:pointer;">View</button></div>`)
                    .css({ display: "flex", "justify-content": "center", "align-items": "center", "text-align": "center" });
            } else {
                $cell.html('');
            }
        });

    // --- Used Components (used_components) ---
    frm.fields_dict.repair_and_return.grid.wrapper
        .find('[data-fieldname="used_components"]').each(function () {
            let $cell = $(this);
            if ($cell.closest('.grid-heading-row').length > 0) return;
            let rowIndex = parseInt($cell.closest('.grid-row').attr('data-idx') || '0') - 1;
            if (rowIndex < 0 || rowIndex >= (frm.doc.repair_and_return || []).length) return;

            let rowData = frm.doc.repair_and_return[rowIndex];
            let val = rowData.used_components || '';

            if (val.trim()) {
                $cell.html(`<div style="width:100%;display:flex;justify-content:center;align-items:center;"><button class="btn btn-xs view-used-components-btn" data-row-idx="${rowIndex}" style="font-size:11px;padding:3px 12px;border-radius:12px;background:#2dce89;color:#fff;border:none;cursor:pointer;">View</button></div>`)
                    .css({ display: "flex", "justify-content": "center", "align-items": "center", "text-align": "center" });
            } else {
                $cell.html('');
            }
        });

    // --- Bind click: Requested Components ---
    $(document).off('click', '.view-components-btn');
    $(document).on('click', '.view-components-btn', function (e) {
        e.preventDefault(); e.stopPropagation();
        let idx = $(this).data('row-idx');
        let rowData = frm.doc.repair_and_return[idx];
        let val = rowData.component_used || '';
        if (!val) { frappe.msgprint('No components found'); return; }
        open_components_view_dialog(rowData.rma_id, val, 'Requested Components');
    });

    // --- Bind click: Used Components ---
    $(document).off('click', '.view-used-components-btn');
    $(document).on('click', '.view-used-components-btn', function (e) {
        e.preventDefault(); e.stopPropagation();
        let idx = $(this).data('row-idx');
        let rowData = frm.doc.repair_and_return[idx];
        let val = rowData.used_components || '';
        if (!val) { frappe.msgprint('No used components found'); return; }
        open_components_view_dialog(rowData.rma_id, val, 'Used Components');
    });
}

function open_components_view_dialog(rma_id, componentText, titlePrefix) {
    let entries = componentText.split(',').map(s => s.trim()).filter(Boolean);
    let rows_html = entries.map(function (entry) {
        let qty = 1; let name = entry;
        let m = entry.match(/\[Qty:(\d+)\]$/);
        if (m) { qty = parseInt(m[1]); name = entry.replace(/\s*\[Qty:\d+\]$/, '').trim(); }
        return `<div style="display:flex;justify-content:space-between;align-items:center;padding:10px 14px;border-bottom:1px solid #f0f0f0;"><div style="font-size:13px;color:#333;"><span style="display:inline-block;width:7px;height:7px;background:#5e72e4;border-radius:50%;margin-right:8px;"></span>${name}</div><div style="font-size:13px;font-weight:600;color:#5e72e4;">Qty: ${qty}</div></div>`;
    }).join('');

    let d = new frappe.ui.Dialog({ title: titlePrefix + ' — ' + (rma_id || ''), size: 'large', fields: [{ fieldtype: 'HTML', fieldname: 'comp_html' }] });
    d.fields_dict.comp_html.$wrapper.html(`<div style="border:1px solid #e3e3e3;border-radius:6px;overflow:hidden;margin-top:8px;"><div style="display:flex;justify-content:space-between;padding:8px 14px;background:#f8f9fa;font-size:11px;font-weight:600;color:#6c757d;text-transform:uppercase;letter-spacing:0.5px;border-bottom:1px solid #e3e3e3;"><span>Component</span><span>Quantity</span></div>${rows_html}</div>`);
    d.show();
}

function trigger_select_components_dialog(frm, cdt, cdn, target_field, dialog_title) {
    let row = locals[cdt][cdn];
    let _dialog_called = false;

    frappe.call({
        method: "frappe.client.get_list",
        args: {
            doctype: "Item",
            filters: { disabled: 0, item_group: "Components" },
            fields: ["name", "item_name", "item_code"],
            limit_page_length: 0,
            order_by: "item_name asc"
        },
        callback: function (r) {
            if (_dialog_called) return;
            _dialog_called = true;
            if (!r.message || !r.message.length) { frappe.msgprint("No components found"); return; }
            open_components_dialog(r.message);
        }
    });

    function open_components_dialog(components_data) {
        let basket = {};

        // Pre-populate basket from existing value using item_code matching 
        let current_value = row[target_field] || '';
        if (current_value) {
            current_value.split(',').map(s => s.trim()).filter(Boolean).forEach(function (entry) {
                let qty = 1; let item_code = entry;
                let m = entry.match(/\[Qty:(\d+)\]$/);
                if (m) { qty = parseInt(m[1]); item_code = entry.replace(/\s*\[Qty:\d+\]$/, '').trim(); }
                let found = components_data.find(c => c.item_code === item_code || c.name === item_code || c.item_name === item_code);
                let display_name = found ? found.item_name : item_code;
                basket[item_code] = { item_code: item_code, item_name: display_name, qty: qty };
            });
        }

        let d = new frappe.ui.Dialog({
            title: dialog_title,
            size: "large",
            fields: [{
                fieldtype: "HTML",
                fieldname: "main_html",
                options: `
                <div style="display:flex;gap:12px;min-height:320px;">
                    <div style="flex:1;display:flex;flex-direction:column;">
                        <div style="font-size:11px;font-weight:600;color:#6c757d;text-transform:uppercase;letter-spacing:0.5px;margin-bottom:6px;">Available Components</div>
                        <input type="text" class="comp-search" placeholder="Search..." style="width:100%;padding:7px 10px;border:1px solid #d0d5dd;border-radius:6px;font-size:13px;outline:none;box-sizing:border-box;margin-bottom:8px;"/>
                        <div class="comp-list" style="max-height:250px;overflow-y:auto;border:1px solid #e3e3e3;border-radius:6px;"></div>
                    </div>
                    <div style="width:1px;background:#e3e3e3;margin:20px 0;"></div>
                    <div style="flex:1;display:flex;flex-direction:column;">
                        <div style="font-size:11px;font-weight:600;color:#6c757d;text-transform:uppercase;letter-spacing:0.5px;margin-bottom:6px;">Added Components</div>
                        <div class="basket-count" style="font-size:12px;color:#5e72e4;margin-bottom:8px;">0 component(s) added</div>
                        <div class="basket-container" style="max-height:250px;overflow-y:auto;border:1px solid #e3e3e3;border-radius:6px;">
                            <div style="padding:10px;font-size:13px;color:#aaa;text-align:center;">No components added yet</div>
                        </div>
                    </div>
                </div>
                <div style="margin-top:14px;text-align:right;">
                    <button class="finish-btn" style="padding:8px 24px;background:#5e72e4;color:#fff;border:none;border-radius:6px;font-size:13px;font-weight:600;cursor:pointer;">✓ Finish &amp; Save</button>
                </div>`
            }]
        });

        d.show();
        let $w = d.$wrapper;

        function get_basket_html() {
            let keys = Object.keys(basket);
            if (!keys.length) return '<div style="padding:10px;font-size:13px;color:#aaa;text-align:center;">No components added yet</div>';
            return keys.map(function (code) {
                let s = basket[code];
                return `<div style="display:flex;align-items:center;justify-content:space-between;padding:8px 10px;border-bottom:1px solid #f0f0f0;"><div style="flex:1;font-size:13px;color:#333;"><span style="display:inline-block;width:7px;height:7px;background:#5e72e4;border-radius:50%;margin-right:8px;"></span>${s.item_name}</div><div style="display:flex;align-items:center;gap:6px;"><span style="font-size:12px;color:#888;">Qty:</span><div style="display:flex;align-items:center;border:1px solid #d0d5dd;border-radius:6px;overflow:hidden;"><button class="bsk-minus" data-code="${code}" style="width:26px;height:26px;background:#f8f9fa;border:none;font-size:15px;cursor:pointer;color:#555;">−</button><input type="number" class="bsk-qty" data-code="${code}" value="${s.qty}" min="1" style="width:40px;height:26px;border:none;border-left:1px solid #d0d5dd;border-right:1px solid #d0d5dd;text-align:center;font-size:13px;outline:none;"/><button class="bsk-plus" data-code="${code}" style="width:26px;height:26px;background:#f8f9fa;border:none;font-size:15px;cursor:pointer;color:#555;">+</button></div><button class="bsk-remove" data-code="${code}" style="background:none;border:none;color:#e74c3c;font-size:18px;cursor:pointer;padding:0 4px;">×</button></div></div>`;
            }).join('');
        }

        function bind_basket_events() {
            let $bc = $w.find('.basket-container');
            $bc.find('.bsk-plus').off('click').on('click', function () { basket[$(this).data('code')].qty = (basket[$(this).data('code')].qty || 1) + 1; refresh_basket(); });
            $bc.find('.bsk-minus').off('click').on('click', function () { basket[$(this).data('code')].qty = Math.max(1, (basket[$(this).data('code')].qty || 1) - 1); refresh_basket(); });
            $bc.find('.bsk-qty').off('input').on('input', function () { let v = parseInt($(this).val()) || 1; basket[$(this).data('code')].qty = v < 1 ? 1 : v; });
            $bc.find('.bsk-remove').off('click').on('click', function () { delete basket[$(this).data('code')]; refresh_basket(); });
        }

        function refresh_basket() {
            $w.find('.basket-container').html(get_basket_html());
            bind_basket_events();
            $w.find('.basket-count').text(Object.keys(basket).length + ' component(s) added');
        }

        function render_list(data) {
            let $list = $w.find('.comp-list');
            $list.empty();
            if (!data.length) { $list.append('<div style="padding:10px 14px;font-size:13px;color:#aaa;">No components found</div>'); return; }
            data.forEach(function (item) {
                let is_sel = !!basket[item.name] || !!basket[item.item_code];
                let $row_el = $(`<div style="display:flex;align-items:center;padding:8px 12px;cursor:pointer;border-bottom:1px solid #f5f5f5;background:${is_sel ? '#eef0fd' : '#fff'};"><div style="width:15px;height:15px;border:1.5px solid ${is_sel ? '#5e72e4' : '#ccc'};border-radius:3px;background:${is_sel ? '#5e72e4' : '#fff'};margin-right:10px;flex-shrink:0;display:flex;align-items:center;justify-content:center;">${is_sel ? '<span style="color:#fff;font-size:10px;">✓</span>' : ''}</div><div style="flex:1;font-size:13px;color:#333;">${item.item_name}</div><div style="font-size:11px;color:#999;">${item.name || item.item_code}</div></div>`);
                $row_el.on('click', function () {
                    let code = item.name || item.item_code;
                    if (!basket[code]) {
                        basket[code] = { item_code: code, item_name: item.item_name, qty: 1 };
                        frappe.show_alert({ message: '"' + item.item_name + '" added', indicator: 'green' });
                    } else {
                        frappe.show_alert({ message: '"' + item.item_name + '" already added. Adjust qty on right.', indicator: 'blue' });
                    }
                    let q = $w.find('.comp-search').val().toLowerCase();
                    render_list(components_data.filter(c => (c.item_name || '').toLowerCase().includes(q) || (c.name || '').toLowerCase().includes(q) || (c.item_code || '').toLowerCase().includes(q)));
                    refresh_basket();
                });
                $list.append($row_el);
            });
        }

        setTimeout(function () {
            render_list(components_data);
            refresh_basket();

            $w.find('.comp-search').on('input', function () {
                let q = $(this).val().toLowerCase();
                render_list(components_data.filter(c => (c.item_name || '').toLowerCase().includes(q) || (c.name || '').toLowerCase().includes(q) || (c.item_code || '').toLowerCase().includes(q)));
            });

            $w.find('.finish-btn').on('click', function () {
                let keys = Object.keys(basket);

                let final_string = keys.map(function (code) {
                    let s = basket[code];
                    return (s.item_code || code) + ' [Qty:' + s.qty + ']';
                }).join(', ');

                locals[cdt][cdn].is_modified = 1;

                // Set value locally in memory ONLY - immediate DB sets are removed to stop pre-mature Material Issues
                frappe.model.set_value(cdt, cdn, target_field, final_string).then(async function () {
                    let current_row = locals[cdt][cdn];
                    current_row.is_modified = 1;
                    frm.refresh_field("repair_and_return");

                    setTimeout(() => {
                        format_components_as_pills(frm);
                    }, 300);

                    console.log(target_field + " saved locally:", current_row[target_field]);
                });

                frappe.show_alert({ message: 'Components updated locally — ' + keys.length + ' component(s) saved', indicator: 'green' });
                d.hide();
            });
        }, 500);
    }
}

function set_current_technician(frm) {
    let current_user = frappe.session.user;
    frappe.call({
        method: "frappe.client.get",
        args: { doctype: "Employee", filters: { 'prefered_email': current_user } },
        callback: function (r) {
            frm.set_value("technician", "");
            if (r.message && r.message.user_id) {
                let employee_id = r.message.name;
                if (employee_id.includes(' - ')) employee_id = employee_id.split(' - ')[0];
                if (!frm.doc.technician.includes(' - ')) {
                    frappe.db.get_value('Employee', employee_id, ['employee', 'employee_name'])
                        .then(r => {
                            if (r.message) {
                                frm.set_value('technician', `${r.message.employee} - ${r.message.employee_name}`);
                            }
                        })
                        .catch(err => { console.error('Error fetching employee:', err); });
                }
            }
        }
    });
}

function setup_field_filters(frm) {
    frm.set_query("lot_no", function () {
        let filters = {};
        if (frm.doc.customer) filters.customer = frm.doc.customer;
        return { filters: filters, ignore_user_permissions: 1, order_by: "creation desc" };
    });
}

function load_technician_rma_data(frm) {
    if (!frm.doc.technician) {
        frappe.show_alert({ message: 'Technician field is required', indicator: 'red' });
        return;
    }

    frappe.call({
        method: "rms.rms.doctype.repair_and_return_technician_view.repair_and_return_technician_view.get_technician_rma_data",
        args: {
            technician: frm.doc.technician,
            customer: frm.doc.customer || '',
            lot_no: frm.doc.lot_no || '',
            warranty_status: frm.doc.warranty_status || '',
            circle: frm.doc.circle || '',
            rma_id: frm.doc.rma_id || '',
            repair_status: frm.doc.repair_status || ''
        },
        callback: async function (r) {
            frm.clear_table("repair_and_return");
            frm.refresh_field("repair_and_return");

            if (r.message && r.message.length > 0) {

                let rma_ids = r.message.map(row => row.rma_id || row.name).filter(Boolean);
                let fresh_data_map = {};

                if (rma_ids.length > 0) {
                    try {
                        let docs = await Promise.all(rma_ids.map(id => frappe.db.get_doc('RMA BIN', id)));
                        docs.forEach(doc => {
                            if (doc) {
                                fresh_data_map[doc.name] = {
                                    component_used_init: doc.component_used_init || '',
                                    component_requested: doc.component_requested || '',
                                    requested_components: doc.requested_components || '',
                                    rma_id_status: doc.rma_id_status || doc.repair_status || '',
                                    fault_found: doc.fault_found || '',
                                    repaired_date: doc.repaired_date || '',
                                    component_details: doc.component_details || []
                                };
                            }
                        });
                    } catch (err) {
                        console.error("Error bulk-fetching RMA BIN data:", err);
                    }
                }

                r.message.forEach(function (row) {
                    let fresh = fresh_data_map[row.rma_id || row.name];
                    if (fresh) {
                        row.component_details = fresh.component_details;
                        row.component_used_init = fresh.component_used_init;
                        row.component_requested = fresh.component_requested;
                        row.requested_components = fresh.requested_components;
                        row.rma_id_status = fresh.rma_id_status;
                        row.fault_found = fresh.fault_found;
                        row.repaired_date = fresh.repaired_date;
                    }
                });

                r.message.forEach(function (row) {
                    let req_comps = '';
                    if (row.component_details && row.component_details.length > 0) {
                        req_comps = row.component_details.map(d => `${d.component_name || d.item_code || ''} [Qty:${d.qty || 1}]`).join(', ');
                    } else {
                        req_comps = row.component_requested || row.requested_components || '';
                    }
                    row.component_requested = req_comps;
                    row.requested_components = req_comps;
                    row.component_used = req_comps;
                    row.component_used_init = row.component_used_init || '';
                });

                localStorage.setItem("repair_and_return_technician_view_snapshot", JSON.stringify(r.message));

                r.message.forEach(function (row) {
                    let child = frm.add_child("repair_and_return");
                    child.lot_no = row.lot_no;
                    child.rma_id = row.rma_id || row.name;

                    if (row.repaired_by) {
                        child.assigned_to = row.repaired_by.includes(" - ") ? row.repaired_by.split(" - ")[0] : row.repaired_by;
                        child.assigned_to_name = row.repaired_by;
                        child.employee_name = row.repaired_by.split(' - ')[1];
                    }

                    child.assigned_date = row.rma_assigned_date;
                    child.repaired_date = row.repaired_date;
                    child.customer = row.customer;
                    child.receiving_r = row.receiving_r || '';
                    child.make = row.make;
                    child.model_no = row.model_no;
                    child.part_no = row.part_no;
                    child.serial_no = row.serial_no;
                    child.warranty_st = row.warranty_status;
                    child.component_used = row.component_requested || row.requested_components || '';
                    child.used_components = row.component_used_init || '';
                    child.fault_found = row.fault_found;
                    child.repair_status = row.rma_id_status;
                    child.material_receipt = row.material_request;
                    child.material_issue = row.material_issue;
                    child.is_modified = 0;

                    if (!child.start_time) child.start_time = frappe.datetime.now_datetime();
                    if (row.submitted_material_receipt) child.material_receipt = row.submitted_material_receipt;
                    if (row.rma_assigned_date) child.assigned_date = row.rma_assigned_date;
                    if (row.receiving_date) {
                        child.receiving_date = row.receiving_date;
                        child.tat = frappe.datetime.get_diff(frappe.datetime.get_today(), row.receiving_date);
                    }
                });

                frm.refresh_field("repair_and_return");
                setTimeout(() => { format_components_as_pills(frm); }, 1000);

                frappe.show_alert({
                    message: `Loaded ${r.message.length} RMA records for ${frm.doc.technician}${get_filter_info(frm)}`,
                    indicator: 'green'
                });
            } else {
                frappe.show_alert({
                    message: `No RMA data found for technician: ${frm.doc.technician}${get_active_filters(frm)}`,
                    indicator: 'orange'
                });
            }
        },
        error: function (err) {
            console.error("Error loading RMA data:", err);
            frappe.show_alert({ message: 'Error loading RMA data', indicator: 'red' });
        }
    });
}

function get_active_filters_array(frm) {
    let filters = [];
    if (frm.doc.customer) filters.push(`Customer: ${frm.doc.customer}`);
    if (frm.doc.lot_no) filters.push(`Lot No: ${frm.doc.lot_no}`);
    if (frm.doc.warranty_status) filters.push(`Warranty: ${frm.doc.warranty_status}`);
    if (frm.doc.circle) filters.push(`Circle: ${frm.doc.circle}`);
    if (frm.doc.rma_id) filters.push(`RMA ID: ${frm.doc.rma_id}`);
    if (frm.doc.repair_status) filters.push(`Status: ${frm.doc.repair_status}`);
    return filters;
}

function get_filter_info(frm) {
    let f = get_active_filters_array(frm);
    return f.length ? ` (Filtered: ${f.join(', ')})` : '';
}

function get_active_filters(frm) {
    let f = get_active_filters_array(frm);
    return f.length ? ` with filters: ${f.join(', ')}` : '';
}

// =============================================================================
// Child Table Event Handlers
// =============================================================================
frappe.ui.form.on("Repair and Return Tech View Table", {

    select_items: function (frm, cdt, cdn) {
        if (window._comp_dialog_open) return;
        window._comp_dialog_open = true;
        setTimeout(() => { window._comp_dialog_open = false; }, 2000);
        trigger_select_components_dialog(frm, cdt, cdn, 'used_components', 'Add Used Components');
    },

    select_components: function (frm, cdt, cdn) {
        if (window._comp_dialog_open) return;
        window._comp_dialog_open = true;
        setTimeout(() => { window._comp_dialog_open = false; }, 2000);
        trigger_select_components_dialog(frm, cdt, cdn, 'component_used', 'Add Requested Components');
    },

    create_material_receipt: async function (frm, cdt, cdn) {
        let row = locals[cdt][cdn];

        if (!row.component_used) {
            frappe.msgprint(__('Please select components first'));
            return;
        }

        if (!row.rma_id) {
            frappe.msgprint(__('RMA ID is required'));
            return;
        }

        if (row.repair_status !== "Under Repair") {
            frappe.throw({
                title: __('Status Validation Failed'),
                indicator: 'red',
                message: `<div style="text-align:center;padding:10px;">
                    <div style="font-size:40px;color:#d9534f;margin-bottom:12px;">🚫</div>
                    <h4 style="color:#333;margin-top:0;font-weight:600;">Request Rejected</h4>
                    <p style="color:#555;font-size:13px;line-height:1.6;">
                        Material transfers are only allowed when the repair status is set to <b>Under Repair</b>.
                    </p>
                    <p style="color:#777;font-size:12px;margin-top:8px;">
                        Current Status:
                        <span class="label label-danger" style="font-size:11px;">
                            ${row.repair_status || 'Empty'}
                        </span>
                    </p>
                </div>`
            });
            return;
        }

        let parsed_items = parse_component_string(row.component_used);
        if (!parsed_items.length) {
            frappe.msgprint(__('No valid components found.'));
            return;
        }

        let item_docs = await get_item_docs_by_codes(parsed_items.map(i => i.item_code));
        if (!item_docs.length) {
            frappe.msgprint(__('No valid Item docs found for selected components.'));
            return;
        }

        try {
            let doc = await frappe.db.get_doc('RMA BIN', row.rma_id);

            if ('component_requested' in doc) doc.component_requested = row.component_used;
            if ('requested_components' in doc) doc.requested_components = row.component_used;

            doc.component_details = [];
            parsed_items.forEach(item => {
                let resolved = item_docs.find(x => x.item_name === item.item_code || x.name === item.item_code);
                doc.component_details.push({
                    doctype: "component_used",
                    component_name: resolved ? resolved.name : item.item_code,
                    qty: item.qty
                });
            });

            doc.fault_found = row.fault_found;
            doc.repaired_date = row.assigned_date;
            doc.rma_id_status = row.repair_status;

            await frappe.call({
                method: 'frappe.client.save',
                args: { doc: doc }
            });

            let draft_entry = null;
            let submitted_item_codes = [];

            let stock_entries = await frappe.db.get_list('Stock Entry', {
                filters: { stock_entry_type: "Material Transfer" },
                fields: ["name", "custom_rma_id", "docstatus"]
            });

            for (let se of stock_entries) {
                if (!se.custom_rma_id) continue;
                let se_rmas = se.custom_rma_id.split(',').map(r => r.trim());
                if (!se_rmas.includes(row.rma_id)) continue;
                let se_doc = await frappe.db.get_doc("Stock Entry", se.name);
                if (se.docstatus === 0) { draft_entry = se_doc; break; }
                if (se.docstatus === 1) { se_doc.items.forEach(i => submitted_item_codes.push(i.item_code)); }
            }

            if (draft_entry) {
                let blocked = [...new Set([...draft_entry.items.map(i => i.item_code), ...submitted_item_codes])];
                let new_items = item_docs.filter(i => !blocked.includes(i.name));
                if (!new_items.length) { frappe.show_alert({ message: __('All selected components are already present in the existing draft or submitted entries.'), indicator: 'orange' }); return; }
                new_items.forEach(item => {
                    let parsed = parsed_items.find(x => x.item_code === item.name || x.item_code === item.item_name);
                    let q = parsed ? parsed.qty : 1;
                    draft_entry.items.push({ item_code: item.name, item_name: item.item_name, description: item.description || item.item_name, uom: item.stock_uom || 'Nos', stock_uom: item.stock_uom || 'Nos', s_warehouse: draft_entry.from_warehouse, t_warehouse: draft_entry.to_warehouse, conversion_factor: 1, qty: q, transfer_qty: q, basic_rate: item.valuation_rate || 0 });
                });
                await frappe.call({ method: "frappe.client.save", args: { doc: draft_entry } });
                frappe.model.set_value(cdt, cdn, "material_receipt", draft_entry.name);
                await frappe.db.set_value("RMA BIN", row.rma_id, "material_request", draft_entry.name);
                frappe.show_alert({ message: __('New components added to existing Draft: ' + draft_entry.name), indicator: 'green' });
                setTimeout(function () { frappe.new_doc("Stock Entry", {}, function () { frappe.set_route("Form", "Stock Entry", draft_entry.name); }); }, 300);
                return;
            }

            let remaining = item_docs.filter(i => !submitted_item_codes.includes(i.name));
            if (!remaining.length) { frappe.show_alert({ message: __('All selected components have already been requested in completed entries.'), indicator: 'orange' }); return; }
            item_docs = remaining;

            frappe.new_doc('Stock Entry', { stock_entry_type: 'Material Transfer', custom_technician: frm.doc.technician, purpose: "Material Transfer", custom_customer: row.customer, custom_rma_id: row.rma_id }, doc => {
                setTimeout(async () => {
                    let se_frm = cur_frm;
                    se_frm.doc.from_warehouse = "Ductus Technologies Pvt Ltd - DTPL";
                    se_frm.doc.to_warehouse = "Repair Floor - DTPL";
                    se_frm.clear_table('items');
                    let res_data = await frappe.db.get_value('RMA', { 'name': frm.doc.lot_no }, 'warehouse');
                    item_docs.forEach(function (item) {
                        let parsed = parsed_items.find(x => x.item_code === item.name || x.item_code === item.item_name);
                        let q = parsed ? parsed.qty : 1;
                        let child = se_frm.add_child('items');
                        child.item_code = item.name; child.item_name = item.item_name;
                        child.description = item.description || item.item_name;
                        child.uom = item.stock_uom || 'Nos'; child.stock_uom = item.stock_uom || 'Nos';
                        child.s_warehouse = res_data?.message?.warehouse || 'Ductus Technologies Pvt Ltd - DTPL'; child.t_warehouse = 'Repair Floor - DTPL';
                        child.conversion_factor = 1; child.qty = q; child.transfer_qty = q; child.basic_rate = item.valuation_rate || 0;
                    });
                    se_frm.refresh_field('items');
                    frm.save();
                    frappe.show_alert({ message: __('Material Transfer created with ' + item_docs.length + ' components for RMA: ' + row.rma_id), indicator: 'blue' });
                }, 500);
            });

        } catch (e) {
            console.error("create_material_receipt failed", e);
            frappe.msgprint({
                title: __("Error"),
                indicator: "red",
                message: e.message || __("Unable to create Material Transfer / update RMA BIN")
            });
        }
    },

    refresh: function (frm) {
        setup_field_filters(frm);
        setTimeout(() => {
            let $h1 = frm.fields_dict.repair_and_return.grid.wrapper.find('.grid-heading-row [data-fieldname="component_used"]');
            if ($h1.length) $h1.html('Component Used');
            let $h2 = frm.fields_dict.repair_and_return.grid.wrapper.find('.grid-heading-row [data-fieldname="used_components"]');
            if ($h2.length) $h2.html('Used Components');
            format_components_as_pills(frm);
        }, 500);
    },

    assigned_to: function (frm, cdt, cdn) {
        let row = locals[cdt][cdn];
        if (row.assigned_to) {
            frappe.db.get_doc('Employee', row.assigned_to)
                .then(item => { frappe.model.set_value(cdt, cdn, 'employee_name', item.employee_name); })
                .catch(() => { frappe.model.set_value(cdt, cdn, 'employee_name', ''); });
        }
    },

    view_remarks: async function (frm, cdt, cdn) {
        let row = locals[cdt][cdn];
        if (!row.rma_id) { frappe.msgprint("RMA ID not found."); return; }
        try {
            let rmaDoc = await frappe.db.get_doc("RMA BIN", row.rma_id);
            let remarks_html = "";
            if (rmaDoc.remarks && rmaDoc.remarks.length > 0) {
                rmaDoc.remarks.slice().reverse().forEach(function (r) {
                    remarks_html += `<div style="padding:12px;margin-bottom:10px;border:1px solid #e3e3e3;border-radius:8px;background:#fafafa;"><div style="display:flex;justify-content:space-between;font-size:12px;color:#6c757d;margin-bottom:6px;"><span>👤 ${r.modified_by || r.owner || "System"}</span><span>🕒 ${r.timestamp || ""}</span></div><div style="font-size:14px;color:#333;">${r.repair_remarks || ""}</div></div>`;
                });
            } else {
                remarks_html = "<p>No previous remarks found.</p>";
            }
            let d = new frappe.ui.Dialog({ title: "Previous Remarks - " + row.rma_id, size: "large", fields: [{ fieldtype: "HTML", fieldname: "remarks_content" }] });
            d.fields_dict.remarks_content.$wrapper.html(remarks_html);
            d.show();
        } catch (err) {
            console.error("Error fetching remarks:", err);
            frappe.msgprint("Unable to load remarks.");
        }
    },

    repair_status: function (frm, cdt, cdn) { locals[cdt][cdn].is_modified = 1; },
    repair_remarks: function (frm, cdt, cdn) { locals[cdt][cdn].is_modified = 1; },
    component_used: function (frm, cdt, cdn) {
        locals[cdt][cdn].is_modified = 1;
        format_components_as_pills(frm);
    },
    used_components: function (frm, cdt, cdn) {
        locals[cdt][cdn].is_modified = 1;
        format_components_as_pills(frm);
    },
    fault_found: function (frm, cdt, cdn) { locals[cdt][cdn].is_modified = 1; },
    serial_no: function (frm, cdt, cdn) { locals[cdt][cdn].is_modified = 1; }
});

frappe.form.link_formatters['Employee'] = function (value, doc) {
    if (doc && doc.employee_name && doc.employee_name !== value) {
        return value + " - " + doc.employee_name;
    }
    return value;
};