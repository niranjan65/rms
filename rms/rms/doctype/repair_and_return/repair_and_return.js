frappe.ui.form.on('Repair and Return', {
    refresh: function (frm) {
        if (frm.custom_buttons["Get Data"]) {
            frm.remove_custom_button("Get Data");
        }

        frm.add_custom_button(__('Get Data'), function () {
            load_and_filter_rma_data(frm);
        }).addClass('btn-primary');

        setup_field_filters(frm);

        frm.set_query("assigned_to", "repair_and_return", function () {
            return {
                filters: {
                    "status": "Active",
                }
            };
        });
    },

    setup: function (frm) {
        if (frm.doc.customer) {
            frm.set_value('customer', '');
        }
    },

    customer: function (frm) {
        if (frm.doc.lot_no) {
            frm.set_value('lot_no', '');
        }
    },

    before_save: async function (frm) {
        // Get previous snapshot from localStorage
        let oldData = JSON.parse(localStorage.getItem("repair_and_return_snapshot") || "[]");
        let local_storage_val = [];

        for (let row of frm.doc.repair_and_return || []) {
            // Find original snapshot row by RMA ID
            let original = oldData.find(o => o.rma_id === row.rma_id);
            if (!original) {
                const rma_bin_doc = await frappe.db.get_doc("RMA BIN", row.rma_id);
                local_storage_val.push(rma_bin_doc);
                continue;
            }

            function normalize(val) {
                if (val === undefined || val === null) return "";
                return val.toString().trim();
            }

            let currentAssignedTo = normalize(row.assigned_to);
            let originalAssignedTo = normalize(original.repaired_by?.split(' - ')[0]);

            let hasAssignmentChanged = currentAssignedTo !== originalAssignedTo;
            let hasRepairStatusChanged = normalize(row.repair_status) !== normalize(original?.rma_id_status);
            let remarksChanged = normalize(row.repair_remarks) !== normalize(original.repair_remarks);

            let hasAnyChange = hasAssignmentChanged || 
                               hasRepairStatusChanged || 
                               remarksChanged || 
                               (normalize(row.component_used) !== normalize(original.component_used)) || 
                               (normalize(row.fault_found) !== normalize(original.fault_found)) || 
                               (normalize(row.assigned_date) !== normalize(original.rma_assigned_date)) || 
                               (normalize(row.repaired_date) !== normalize(original.repaired_date));

            if (hasAnyChange) {
                let rmaDoc = await frappe.db.get_doc("RMA BIN", row.rma_id);

                // 1. Handle assignment change
                if (hasAssignmentChanged) {
                    if (row.assigned_to) {
                        let full_repaired_by = row.employee_name ? `${row.assigned_to} - ${row.employee_name}` : row.assigned_to;
                        rmaDoc.repaired_by = full_repaired_by;

                        // Force status to "Repair Technician Assigned" in RMA BIN fields
                        rmaDoc.rma_id_status = "Repair Technician Assigned";
                        rmaDoc.repair_status = "Repair Technician Assigned";

                        // Append status history tracking
                        if (!rmaDoc.rma_status) rmaDoc.rma_status = [];
                        rmaDoc.rma_status.push({
                            repair_status: "Repair Technician Assigned",
                            timestamp: frappe.datetime.now_datetime()
                        });

                        // Format status update remarks as "Assigned to Name (ID)"
                        if (!rmaDoc.rma_tracking_status) rmaDoc.rma_tracking_status = [];
                        let assignee_display = row.employee_name ? `${row.employee_name} (${row.assigned_to})` : row.assigned_to;
                        rmaDoc.rma_tracking_status.push({
                            status: "RMA Assign",
                            timestamp: frappe.datetime.now_datetime(),
                            modified_by1: frappe.session.user,
                            remarks: `Assigned to ${assignee_display}`,
                            rma_status: "Repair Technician Assigned"
                        });
                    } else {
                        rmaDoc.repaired_by = null;
                        rmaDoc.rma_id_status = null;
                        rmaDoc.repair_status = null;
                    }
                }

                // 2. Handle component used changes
                if (normalize(row.component_used) !== normalize(original.component_used)) {
                    rmaDoc.component_used = row.component_used || null;
                }

                // 3. Handle repair status change (if assignment didn't already force it to "Repair Technician Assigned")
                if (hasRepairStatusChanged && !hasAssignmentChanged) {
                    rmaDoc.rma_id_status = row.repair_status || null;
                    rmaDoc.repair_status = row.repair_status || null;
                    if (!rmaDoc.rma_status) rmaDoc.rma_status = [];
                    rmaDoc.rma_status.push({
                        repair_status: row.repair_status,
                        timestamp: frappe.datetime.now_datetime()
                    });
                }

                // 4. Handle fault found change
                if (normalize(row.fault_found) !== normalize(original.fault_found)) {
                    rmaDoc.fault_found = row.fault_found || null;
                }

                // 5. Handle assigned date change
                if (normalize(row.assigned_date) !== normalize(original.rma_assigned_date)) {
                    rmaDoc.rma_assigned_date = row.assigned_date || null;
                }

                // 6. Handle repaired date change
                if (normalize(row.repaired_date) !== normalize(original.repaired_date)) {
                    rmaDoc.repaired_date = row.repaired_date || null;
                }

                // 7. Handle remarks change
                if (remarksChanged) {
                    if (!rmaDoc.remarks) rmaDoc.remarks = [];
                    rmaDoc.remarks.push({
                        repair_remarks: row.repair_remarks,
                        timestamp: frappe.datetime.now_datetime()
                    });
                    rmaDoc.repair_remarks = row.repair_remarks || null;
                }

                rmaDoc.last_updated_on = frappe.datetime.now_datetime();

                // Save modified rmaDoc
                await frappe.call({
                    method: "frappe.client.save",
                    args: { doc: rmaDoc }
                });
            }

            const rma_bin_data = await frappe.db.get_doc("RMA BIN", row.rma_id);
            local_storage_val.push(rma_bin_data);
        }

        localStorage.setItem("repair_and_return_snapshot", JSON.stringify(local_storage_val));
    },

    onload_post_render: function (frm) {
        localStorage.removeItem("repair_and_return_snapshot");

        frm.set_value("customer", "")
        frm.set_value("lot_no", "")
        frm.set_value("warranty_status", "")
        frm.set_value("circle", "")
        frm.clear_table("repair_and_return");
        frm.refresh_field("repair_and_return");
    },
});

/* ===================================================
 * Repair and Return Child Table Event Handlers
 * =================================================== */
frappe.ui.form.on('Repair and Return Table', {
    assigned_to: function (frm, cdt, cdn) {
        let row = locals[cdt][cdn];

        if (row.assigned_to) {
            if (!row.assigned_date) {
                frappe.model.set_value(cdt, cdn, 'assigned_date', frappe.datetime.get_today());
            }

            frappe.db.get_value('Employee', row.assigned_to, 'employee_name')
                .then(r => {
                    if (r && r.message) {
                        frappe.model.set_value(cdt, cdn, 'employee_name', r.message.employee_name);
                    } else {
                        frappe.model.set_value(cdt, cdn, 'employee_name', '');
                    }
                })
                .catch(err => {
                    console.log('Error fetching employee name:', err);
                    frappe.model.set_value(cdt, cdn, 'employee_name', '');
                });
        } else {
            frappe.model.set_value(cdt, cdn, 'assigned_date', '');
            frappe.model.set_value(cdt, cdn, 'employee_name', '');
        }
    },

    view_remarks: async function (frm, cdt, cdn) {
        let row = locals[cdt][cdn];

        if (!row.rma_id) {
            frappe.msgprint("RMA ID not found.");
            return;
        }

        let rmaDoc = await frappe.db.get_doc("RMA BIN", row.rma_id);
        let remarks_html = "";

        if (rmaDoc.remarks && rmaDoc.remarks.length > 0) {
            rmaDoc.remarks.slice().reverse().forEach(function (r) {
                remarks_html += `
                    <div style="
                        padding:12px;
                        margin-bottom:10px;
                        border:1px solid #e3e3e3;
                        border-radius:8px;
                        background:#fafafa;
                    ">
                        <div style="
                            display:flex;
                            justify-content:space-between;
                            font-size:12px;
                            color:#6c757d;
                            margin-bottom:6px;
                        ">
                            <span>👤 ${r.modified_by || r.owner || "System"}</span>
                            <span>🕒 ${r.timestamp || ""}</span>
                        </div>
                        <div style="
                            font-size:14px;
                            color:#333;
                        ">
                            ${r.repair_remarks || ""}
                        </div>
                    </div>
                `;
            });
        } else {
            remarks_html = "<p>No previous remarks found.</p>";
        }

        let d = new frappe.ui.Dialog({
            title: "Previous Remarks - " + row.rma_id,
            size: "large",
            fields: [
                {
                    fieldtype: "HTML",
                    fieldname: "remarks_content"
                }
            ]
        });

        d.fields_dict.remarks_content.$wrapper.html(remarks_html);
        d.show();
    }
});

/* ===================================================
 * Utility / Helper Functions
 * =================================================== */
function load_and_filter_rma_data(frm) {
    frappe.call({
        method: "rms.rms.doctype.repair_and_return.repair_and_return.get_filtered_rma_data",
        args: {
            customer: frm.doc.customer || '',
            lot_no: frm.doc.lot_no || '',
            warranty_status: frm.doc.warranty_status || '',
            circle: frm.doc.circle || '',
            rma_id: frm.doc.rma_id || '',
            repair_status: frm.doc.repair_status || '',
        },
        callback: async function (r) {
            frm.clear_table("repair_and_return");
            frm.refresh_field("repair_and_return");

            if (r.message && r.message.length > 0) {
                localStorage.setItem("repair_and_return_snapshot", JSON.stringify(r.message));

                r.message.forEach(async function (row) {
                    let child = frm.add_child("repair_and_return");

                    child.lot_no = row.lot_no;
                    child.rma_id = row.rma_reference || row.rma_id || row.name;
                    child.customer = row.customer;
                    child.receiving_remarks = row.receiving_remarks || '';
                    child.repair_tat = row.total_repair_time || '';

                    if (row.repaired_by && row.repaired_by.trim() !== '') {
                        child.assigned_to = extract_employee_id(row.repaired_by);
                        child.assigned_to_name = row.repaired_by;
                        child.employee_name = row.repaired_by.split(' - ')[1];
                    } else {
                        child.assigned_to = '';
                        child.assigned_to_name = '';
                        child.employee_name = '';
                    }

                    child.make = row.make;
                    child.model_no = row.model_no;
                    child.part_no = row.part_no;
                    child.serial_no = row.serial_no;
                    child.warranty_st = row.warranty_status;
                    child.warranty_status = row.warranty_status;
                    child.circle = row.circle;
                    child.lr_no = row.lr_no;
                    child.delivery_challan_no = row.delivery_challan_no;
                    child.receiving_date = row.receiving_date;
                    child.assigned_date = row.rma_assigned_date;
                    child.component_used = row.component_used || '';
                    child.repair_status = row?.rma_id_status;

                    if (row.fault_found) {
                        child.fault_found = row.fault_found;
                    }

                    if (row.receiving_date) {
                        let today_date = frappe.datetime.get_today();
                        let diff = frappe.datetime.get_diff(today_date, row.receiving_date);
                        child.tat = diff;
                    }

                    if (row.repaired_date) {
                        child.repaired_date = row.repaired_date;
                    }
                });

                frm.refresh_field("repair_and_return");

                let filter_info = get_filter_info(frm);
                frappe.show_alert({
                    message: `Loaded ${r.message.length} RMA records${filter_info}`,
                    indicator: 'green'
                });

            } else {
                frm.clear_table("repair_and_return");
                frm.refresh_field("repair_and_return");

                let filter_text = get_active_filters(frm);
                frappe.show_alert({
                    message: `No RMA data found${filter_text}`,
                    indicator: 'orange'
                });
            }
        },
        error: function (r) {
            console.error("Error loading RMA data:", r);
            frappe.show_alert({
                message: 'Error loading RMA data',
                indicator: 'red'
            });
        }
    });
}

frappe.ui.form.on('Repair and Return', {
    validate: function (frm) {
        (frm.doc.repair_and_return || []).forEach((row, idx) => {
            if (row.assigned_date && row.receiving_date) {
                let assigned = frappe.datetime.str_to_obj(row.assigned_date);
                let receiving = frappe.datetime.str_to_obj(row.receiving_date);

                if (assigned < receiving) {
                    frappe.throw({
                        title: __("Invalid Assigned Date"),
                        message: __(
                            "Assigned Date cannot be before Receiving Date.<br><br>" +
                            "<b>Row:</b> {0}<br>" +
                            "<b>Receiving Date:</b> {1}<br>" +
                            "<b>Assigned Date:</b> {2}",
                            [idx + 1, row.receiving_date, row.assigned_date]
                        )
                    });
                }
            }
        });

        frm.refresh_field("repair_and_return");
    }
});

function setup_field_filters(frm) {
    frm.set_query("lot_no", function () {
        if (frm.doc.customer) {
            return {
                "filters": {
                    "customer": frm.doc.customer,
                }
            };
        }
    });
}

function extract_employee_id(repaired_by_value) {
    if (!repaired_by_value) return '';

    if (repaired_by_value.includes(' - ')) {
        return repaired_by_value.split(' - ')[0].trim();
    }

    return repaired_by_value.trim();
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
    let filters = get_active_filters_array(frm);
    if (filters.length > 0) {
        return ` (Filtered: ${filters.join(', ')})`;
    }
    return '';
}

function get_active_filters(frm) {
    let filters = get_active_filters_array(frm);
    if (filters.length > 0) {
        return ` with filters: ${filters.join(', ')}`;
    }
    return '';
}

frappe.form.link_formatters['Employee'] = function (value, doc) {
    if (doc && doc.employee_name && doc.employee_name !== value) {
        return value + " - " + doc.employee_name;
    } else {
        return value;
    }
};