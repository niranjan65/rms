
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
        // doc.repair_status = normalized_status;
        doc.rma_id_status = normalized_status;

        if (normalized_status === "QC Technician Assigned") {
            doc.quality_check_status = "QC Technician Assigned";
        }

        return true;
    }
    return false;
}

function safe_add_tracking_history(doc, status_type, remarks_text, rma_status_val) {
    doc.rma_tracking_status = doc.rma_tracking_status || [];
    let is_duplicate = false;
    if (doc.rma_tracking_status.length > 0) {
        let last_entry = doc.rma_tracking_status[doc.rma_tracking_status.length - 1];
        if (last_entry.status === status_type && 
            last_entry.remarks === remarks_text && 
            last_entry.rma_status === rma_status_val) {
            is_duplicate = true;
        }
    }
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

function setup_field_filters(frm) {
    frm.set_query("lot_no", function () {
        let filters = {};
        if (frm.doc.customer) {
            filters.customer = frm.doc.customer;
        }
        return {
            filters: filters,
            ignore_user_permissions: 1,
            order_by: "creation desc"
        };
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
    let filters = get_active_filters_array(frm);
    if (filters.length > 0) {
        return ` (Filtered: ${filters.join(', ')})`;
    }
    return '';
}

// Main load function - requests "Repaired & Ready for Quality check" status items by default
async function load_quality_check_data(frm) {
    frappe.call({
        method: "rms.rms.doctype.quality_check.quality_check.get_quality_check_data",
        args: {
            customer: frm.doc.customer || '',
            lot_no: frm.doc.lot_no || '',
            warranty_status: frm.doc.warranty_status || '',
            circle: frm.doc.circle || '',
            rma_id: frm.doc.rma_id || '',
            repair_status: frm.doc.repair_status || 'Repaired & Ready for Quality check'
        },
        callback: async function (r) {
            console.log("RMA Data Response:", r);
            frm.clear_table("quality_check");
            frm.refresh_field("quality_check");

            if (r.message && r.message.length > 0) {
                frm.clear_table("quality_check");

                console.log("Loaded RMA data:", r.message);
                localStorage.setItem("quality_check_snapshot", JSON.stringify(r.message));

                for (const row of r.message) {
                    let child = frm.add_child("quality_check");

                    // Map basic fields from RMA BIN to child table
                    child.lot_no = row.lot_no;
                    child.rma_id = row.rma_id || row.name;
                    child.customer = (row.customer || '').substring(0, 140);
                    child.serial_no = row.serial_no;
                    child.warranty_st = row.warranty_status;
                    child.repair_status = row.rma_id_status;

                    let latest_rma = await frappe.db.get_value(
                        "RMA BIN",
                        row.rma_id || row.name,
                        "repair_remarks"
                    );

                    // child.repair_remarks = latest_rma?.message?.repair_remarks || '';
                    child.warranty_status = row.warranty_status;
                    child.quality_check_pass = row.quality_check_pass;
                    child.quality_check_done = row.quality_check_done;
                    child.quality_tat = row.total_quality_time || '';

                    // Parse Assigned To (repaired_by)
                    if (row.repaired_by) {
                        const assignedToData = await parseEmployeeString(row.repaired_by);
                        child.assigned_to = assignedToData.id;
                        child.assigned_to_name = assignedToData.name;
                    } else {
                        child.assigned_to = '';
                        child.assigned_to_name = '';
                    }

                    // Parse Quality Check Assigned To
                    if (row.quality_check_assigned_to && row.quality_check_assigned_to !== null) {
                        const qcAssignedData = await parseEmployeeString(row.quality_check_assigned_to);
                        child.quality_check_assign_to = qcAssignedData.id;
                        child.quality_check_assigned_to_name = qcAssignedData.name;
                    } else {
                        child.quality_check_assign_to = '';
                        child.quality_check_assigned_to_name = '';
                    }

                    // Store the RMA BIN name for updating later
                    child.rma_bin_name = row.rma_id || row.name;
                    child.receiving_remarks = row.receiving_remarks;

                    // Fetch component_details from RMA BIN
                    try {
                        let rma_bin_doc = await frappe.db.get_doc("RMA BIN", row.rma_id || row.name);
                        if (rma_bin_doc && rma_bin_doc.component_details && rma_bin_doc.component_details.length) {
                            rma_bin_doc.component_details.forEach(function (c) {
                                let comp_row = frappe.model.add_child(child, "Components Used", "component_details");
                                comp_row.component_name = c.component_name;
                                comp_row.qty = c.qty;
                            });
                        }
                    } catch (e) {
                        console.error("Error fetching component_details for", row.rma_id, e);
                    }

                    // Existing quality check data if available
                    child.quality_check_date = row.quality_check_assigned_date || '';

                    if (row.receiving_date) {
                        child.receiving_date = row.receiving_date;
                        let today_date = frappe.datetime.get_today();
                        let diff = frappe.datetime.get_diff(today_date, row.receiving_date);
                        child.tat = diff;
                    }

                    if (row.quality_check_done_date) {
                        child.quality_check_done_date = row.quality_check_done_date;
                    }
                }

                frm.clear_table("component_details");
                for (const row of r.message) {
                    try {
                        let rma_bin_doc = await frappe.db.get_doc("RMA BIN", row.rma_id || row.name);
                        if (rma_bin_doc && rma_bin_doc.component_details && rma_bin_doc.component_details.length) {
                            rma_bin_doc.component_details.forEach(function (c) {
                                let comp_row = frm.add_child("component_details");
                                comp_row.component_name = c.component_name;
                                comp_row.qty = c.qty;
                            });
                        }
                    } catch (e) {
                        console.error("Error fetching component_details for", row.rma_id, e);
                    }
                }
                frm.refresh_field("component_details");
                frm.refresh_field("quality_check");

                // Refresh grid to apply formatters
                setTimeout(() => {
                    if (frm.fields_dict.quality_check && frm.fields_dict.quality_check.grid) {
                        frm.fields_dict.quality_check.grid.refresh();
                    }
                }, 100);

                let filter_info = get_filter_info(frm);
                frappe.show_alert({
                    message: `Loaded ${r.message.length} RMA records${filter_info}`,
                    indicator: 'green'
                });

            } else {
                frm.clear_table("quality_check");
                frm.refresh_field("quality_check");

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

// Helper function to refresh employee display names after save
async function refreshEmployeeDisplayNames(frm, updatedData) {
    for (let row of frm.doc.quality_check) {
        let updatedRow = updatedData.find(u => u.rma_id === row.rma_id);
        if (!updatedRow) continue;

        if (updatedRow.repaired_by) {
            const assignedToData = await parseEmployeeString(updatedRow.repaired_by);
            row.assigned_to_name = assignedToData.name;
        }

        if (updatedRow.quality_check_assigned_to) {
            const qcAssignedData = await parseEmployeeString(updatedRow.quality_check_assigned_to);
            row.quality_check_assigned_to_name = qcAssignedData.name;
        }
    }

    frm.refresh_field("quality_check");

    setTimeout(() => {
        if (frm.fields_dict.quality_check && frm.fields_dict.quality_check.grid) {
            frm.fields_dict.quality_check.grid.refresh();

            frm.fields_dict.quality_check.grid.grid_rows.forEach(grid_row => {
                if (grid_row.doc.doctype === "Quality Check Table") {
                    if (grid_row.doc.quality_check_assign_to && grid_row.doc.quality_check_assigned_to_name) {
                        let qc_cell = grid_row.row.find('[data-fieldname="quality_check_assign_to"]');
                        if (qc_cell.length) {
                            qc_cell.text(`${grid_row.doc.quality_check_assign_to} - ${grid_row.doc.quality_check_assigned_to_name}`);
                        }
                    }

                    if (grid_row.doc.assigned_to && grid_row.doc.assigned_to_name) {
                        let assigned_cell = grid_row.row.find('[data-fieldname="assigned_to"]');
                        if (assigned_cell.length) {
                            assigned_cell.text(`${grid_row.doc.assigned_to} - ${grid_row.doc.assigned_to_name}`);
                        }
                    }
                }
            });
        }
    }, 200);
}

async function parseEmployeeString(employeeString) {
    if (!employeeString) {
        return { id: '', name: '' };
    }

    if (employeeString.includes(' - ')) {
        const parts = employeeString.split(' - ');
        return { id: parts[0], name: parts[1] || '' };
    }

    try {
        const byNameResult = await frappe.db.get_list('Employee', {
            filters: [['employee_name', '=', employeeString]],
            fields: ['name', 'employee_name'],
            limit: 1
        });

        if (byNameResult && byNameResult.length > 0) {
            return {
                id: byNameResult[0].name,
                name: byNameResult[0].employee_name
            };
        }

        const byIdResult = await frappe.db.get_value('Employee', employeeString, 'employee_name');
        if (byIdResult && byIdResult.message && byIdResult.message.employee_name) {
            return {
                id: employeeString,
                name: byIdResult.message.employee_name
            };
        }
    } catch (err) {
        console.error('Error fetching employee data for:', employeeString, err);
    }

    return { id: employeeString, name: '' };
}

// Main form events
frappe.ui.form.on('Quality Check', {

    refresh: function (frm) {
        try {
            frappe.dom.inject_style(`
                .grid-row .btn[data-fieldname="view_details"],
                .grid-row .btn[data-fieldname="view_remarks"] {
                    background-color: #1b66ec !important;
                    color: #ffffff !important;
                    font-weight: 500 !important;
                    padding: 3px 6px !important;
                    font-size: 11px !important;
                    border-radius: 4px !important;
                    border: none !important;
                    max-width: 100% !important;
                    overflow: hidden !important;
                    text-overflow: ellipsis !important;
                    white-space: nowrap !important;
                    box-shadow: 0 1px 2px rgba(0,0,0,0.1) !important;
                }
                .grid-row .btn[data-fieldname="view_details"]:hover,
                .grid-row .btn[data-fieldname="view_remarks"]:hover {
                    background-color: #0b4ec5 !important;
                }
                .rma-details-modal td {
                    padding: 4px 6px !important;
                }
                .rma-details-modal .section-title {
                    font-size: 12px;
                    font-weight: 700;
                    color: #2b6cb0;
                    border-bottom: 2px solid #e2e8f0;
                    padding-bottom: 4px;
                    margin-bottom: 8px;
                    text-transform: uppercase;
                    letter-spacing: 0.5px;
                }
            `);
        } catch (e) {
            console.warn("Style injection failed", e);
        }

        frm.remove_custom_button(__('Get Data'));

        let btn = frm.add_custom_button(__('Get Data'), function () {
            load_quality_check_data(frm);
        });
        btn.addClass('btn-primary');

        setup_field_filters(frm);

        frm.set_query("quality_check_assign_to", "quality_check", function () {
            return { filters: { "status": "Active" } };
        });
    },

    customer: function (frm) {
        if (frm.doc.lot_no) {
            frm.set_value('lot_no', '');
        }
    },

    rma_id: function (frm) {
        console.log("RMA ID changed to:", frm.doc.rma_id);
    },

    before_save: async function (frm) {
        console.log("before save called");

        let oldData = JSON.parse(localStorage.getItem("quality_check_snapshot") || "[]");
        let local_storage_val = [];

        for (let row of frm.doc.quality_check || []) {
            let original = oldData.find(o => o.rma_id === row.rma_id);
            if (!original) continue;

            function normalize(val) {
                if (val === undefined || val === null) return "";
                return String(val).trim();
            }

            let currentQC = normalize(row.quality_check_assign_to);
            let originalQC = original.quality_check_assigned_to ? normalize(original.quality_check_assigned_to.split(' - ')[0]) : '';

            let qcDoneChanged = row.quality_check_done !== original.quality_check_done;
            let qcDateChanged = normalize(row.quality_check_date) !== normalize(original.quality_check_assigned_date);
            let remarksChanged = normalize(row.repair_remarks) !== normalize(original.repair_remarks) && normalize(row.repair_remarks) !== "";
            let qcAssignChanged = currentQC !== originalQC;
            
            let statusChanged = normalize(row.repair_status) !== normalize(original.rma_id_status);

            let hasAnyChange = qcAssignChanged || qcDoneChanged || qcDateChanged || statusChanged || remarksChanged;

            if (hasAnyChange) {
                let rmaDoc = await frappe.db.get_doc("RMA BIN", row.rma_id);
                let docChanged = false;

                // 1. Handle Quality Check Assignment Change & Force Status "QC Technician Assigned"
                if (qcAssignChanged) {
                    if (row.quality_check_assign_to) {
                        const qcAssignedData = await parseEmployeeString(row.quality_check_assign_to);
                        rmaDoc.quality_check_assigned_to = `${qcAssignedData.id} - ${qcAssignedData.name}`;
                        
                        // Force state to "QC Technician Assigned" on local child grid rows
                        row.repair_status = "QC Technician Assigned";
                        statusChanged = true; // Marks status changed to true

                        rmaDoc.quality_check_status = "QC Technician Assigned";
                        docChanged = true;
                        
                        // Informative name-and-id-parenthesis logging
                        let assignee_display = qcAssignedData.name ? `${qcAssignedData.name} (${qcAssignedData.id})` : qcAssignedData.id;
                        safe_add_tracking_history(
                            rmaDoc,
                            "RMA Q/C Assigned",
                            `Quality Check Assigned to ${assignee_display}`,
                            "QC Technician Assigned"
                        );

                        // Save status and update rma_id_status / repair_status fields
                        let addedStatus = safe_add_status_tracking(rmaDoc, "QC Technician Assigned");
                        if (addedStatus) docChanged = true;
                    } else {
                        rmaDoc.quality_check_assigned_to = null;
                        rmaDoc.quality_check_status = null;
                        docChanged = true;
                    }
                }

                // 2. Handle Quality Check Done (Pass/Fail)
                if (qcDoneChanged) {
                    rmaDoc.quality_check_done = row.quality_check_done;
                    docChanged = true;
                }

                // 3. Handle QC Assigned Date
                if (qcDateChanged) {
                    rmaDoc.quality_check_assigned_date = row.quality_check_date;
                    docChanged = true;
                }

                // 4. Handle Status Change (if assignment didn't already force it to QC Technician Assigned)
                if (statusChanged && !qcAssignChanged) {
                    let addedStatus = safe_add_status_tracking(rmaDoc, row.repair_status);
                    if (addedStatus) docChanged = true;
                }

                // 5. Handle Remarks Change (using deduplicated helper to prevent repeats)
                if (remarksChanged) {
                    let addedRemark = safe_add_remark(rmaDoc, row.repair_remarks);
                    if (addedRemark) docChanged = true;
                }

                if (docChanged) {
                    rmaDoc.last_updated_on = frappe.datetime.now_datetime();
                    let saved = await frappe.call({
                        method: "frappe.client.save",
                        args: { doc: rmaDoc }
                    });
                    local_storage_val.push(saved.message);
                } else {
                    local_storage_val.push(rmaDoc);
                }
            } else {
                let rmaDoc = await frappe.db.get_doc("RMA BIN", row.rma_id);
                local_storage_val.push(rmaDoc);
            }
        }

        localStorage.setItem("quality_check_snapshot", JSON.stringify(local_storage_val));
        await refreshEmployeeDisplayNames(frm, local_storage_val);
    },

    onload_post_render: function (frm) {
        localStorage.removeItem("quality_check_snapshot");

        frm.set_value("customer", "")
        frm.set_value("lot_no", "")
        frm.clear_table("quality_check");
        frm.refresh_field("quality_check");
    },

    validate: function (frm) {
        let errors = [];

        (frm.doc.quality_check || []).forEach((row, idx) => {

            if (row.receiving_date && row.quality_check_date) {

                let receiving = frappe.datetime.str_to_obj(row.receiving_date);
                let qc_date = frappe.datetime.str_to_obj(row.quality_check_date);

                if (qc_date < receiving) {
                    frappe.throw({
                        title: __("Invalid Quality Check Date"),
                        message: __(
                            "Quality Check Date cannot be before Receiving Date.<br><br>" +
                            "<b>Row:</b> {0}<br>" +
                            "<b>Receiving Date:</b> {1}<br>" +
                            "<b>Quality Check Date:</b> {2}",
                            [idx + 1, row.receiving_date, row.quality_check_date]
                        )
                    });
                }
            }

            let assignedToId = row.assigned_to || '';
            let qcAssignToId = row.quality_check_assign_to || '';

            if (assignedToId && qcAssignToId && assignedToId === qcAssignToId) {
                errors.push(
                    `• Row ${idx + 1} (RMA ID <b>${row.rma_id || 'Unknown'}</b>): Repair and Quality Check Engineer cannot be the same.`
                );
            }

        });

        if (errors.length > 0) {
            frappe.throw(`
                <p>Error</p>
                ${errors.join("<br>")}
            `);
        }

        frm.refresh_field("quality_check");
    }

});

// Consolidated Child Table specific events
frappe.ui.form.on("Quality Check table", {
    quality_check_assign_to: function (frm, cdt, cdn) {
        let row = locals[cdt][cdn];

        row.quality_check_date = frappe.datetime.get_today();
        frm.refresh_field("quality_check");

        if (row.quality_check_assign_to) {
            frappe.model.set_value(cdt, cdn, 'quality_check_date', frappe.datetime.get_today());

            frappe.db.get_doc('Employee', row.quality_check_assign_to).then(item => {
                frappe.model.set_value(cdt, cdn, 'quality_check_assigned_to_name', item.employee_name);
            }).catch(err => {
                console.error('Error fetching employee:', err);
                frappe.model.set_value(cdt, cdn, 'quality_check_assigned_to_name', '');
            });
        } else {
            frappe.model.set_value(cdt, cdn, 'quality_check_date', '');
        }
    },

    form_render: function (frm, cdt, cdn) {
        let row = locals[cdt][cdn];
        let grid_row = frm.fields_dict.quality_check.grid.grid_rows_by_docname[cdn];

        if (grid_row) {
            if (row.quality_check_assign_to && row.quality_check_assigned_to_name) {
                let field = grid_row.get_field('quality_check_assign_to');
                if (field && field.$input) {
                    field.$input.val(`${row.quality_check_assign_to} - ${row.quality_check_assigned_to_name}`);
                }
            }

            if (row.assigned_to && row.assigned_to_name) {
                let field = grid_row.get_field('assigned_to');
                if (field && field.$input) {
                    field.$input.val(`${row.assigned_to} - ${row.assigned_to_name}`);
                }
            }
        }
    },

    view_remarks: async function (frm, cdt, cdn) {
        let row = locals[cdt][cdn];
        if (!row.rma_id) {
            frappe.msgprint("RMA ID not found.");
            return;
        }

        try {
            let rmaDoc = await frappe.db.get_doc("RMA BIN", row.rma_id);
            let remarks_html = "";

            if (rmaDoc.remarks && rmaDoc.remarks.length > 0) {
                rmaDoc.remarks.slice().reverse().forEach(function (r) {
                    remarks_html += `
                        <div style="padding:12px; margin-bottom:10px; border:1px solid #e3e3e3; border-radius:8px; background:#fafafa;">
                            <div style="display:flex; justify-content:space-between; font-size:12px; color:#6c757d; margin-bottom:6px;">
                                <span>👤 ${r.modified_by || r.owner || "System"}</span>
                                <span>🕒 ${r.timestamp || ""}</span>
                            </div>
                            <div style="font-size:14px; color:#333;">
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

        } catch (err) {
            console.error("Error fetching remarks:", err);
            frappe.msgprint("Unable to load remarks.");
        }
    },

    view_details: async function (frm, cdt, cdn) {
        let row = locals[cdt][cdn];
        if (!row.rma_id) {
            frappe.msgprint(__("RMA ID not found."));
            return;
        }

        frappe.dom.freeze(__("Loading Details..."));

        try {
            let rmaDoc = await frappe.db.get_doc("RMA BIN", row.rma_id);
            console.log("material_issue raw:", JSON.stringify(rmaDoc.material_issue));
            frappe.dom.unfreeze();

            // Formal Dialog HTML Markup (Components Selected removed, Receiving Remarks box shrunk)
            let details_html = `
                <div class="rma-details-modal" style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; color: #2d3748; padding: 5px;">
                    
                    <!-- Title & Header section -->
                    <div style="background: #f7fafc; border: 1px solid #e2e8f0; border-radius: 6px; padding: 12px; margin-bottom: 15px;">
                        <div style="display: flex; justify-content: space-between; align-items: center; flex-wrap: wrap;">
                            <div>
                                <span style="font-size: 10px; text-transform: uppercase; color: #718096; font-weight: 600; display: block; margin-bottom: 2px;">RMA Record</span>
                                <span style="font-size: 16px; font-weight: 700; color: #1a202c;">${rmaDoc.name}</span>
                            </div>
                            <div>
                                <span style="font-size: 10px; text-transform: uppercase; color: #718096; font-weight: 600; display: block; margin-bottom: 2px; text-align: right;">Status</span>
                                <span style="background-color: #2b6cb0; color: #ffffff; padding: 4px 10px; font-size: 11px; font-weight: 600; border-radius: 4px; display: inline-block;">
                                    ${rmaDoc.rma_id_status || rmaDoc.repair_status || 'Unknown'}
                                </span>
                            </div>
                        </div>
                    </div>

                    <!-- Layout split: Receiving Model (Left) & Repair Model (Right) -->
                    <div style="display: flex; gap: 20px; flex-wrap: wrap;">
                        
                        <!-- Left Panel: Receiving Model -->
                        <div style="flex: 1; min-width: 280px; max-width: 100%;">
                            <div class="section-title"><b>Receiving Model</b></div>
                            <table style="width: 100%; border-collapse: collapse; font-size: 12px; margin-bottom: 15px;">
                                <tbody>
                                    <tr style="border-bottom: 1px solid #f7fafc;">
                                        <td style="width: 45%; color: #718096; font-weight: 500;">Customer:</td>
                                        <td style="font-weight: 600; color: #2d3748;">${rmaDoc.customer || 'N/A'}</td>
                                    </tr>
                                    <tr style="border-bottom: 1px solid #f7fafc;">
                                        <td style="color: #718096; font-weight: 500;">Lot No.:</td>
                                        <td>${rmaDoc.lot_no || 'N/A'}</td>
                                    </tr>
                                    <tr style="border-bottom: 1px solid #f7fafc;">
                                        <td style="color: #718096; font-weight: 500;">Make / Model:</td>
                                        <td>${rmaDoc.make || 'N/A'} / ${rmaDoc.model_no || 'N/A'}</td>
                                    </tr>
                                    <tr style="border-bottom: 1px solid #f7fafc;">
                                        <td style="color: #718096; font-weight: 500;">Part No.:</td>
                                        <td>${rmaDoc.part_no || 'N/A'}</td>
                                    </tr>
                                    <tr style="border-bottom: 1px solid #f7fafc;">
                                        <td style="color: #718096; font-weight: 500;">Serial No.:</td>
                                        <td style="font-weight: 600; color: #2d3748;">${rmaDoc.serial_no || 'N/A'}</td>
                                    </tr>
                                    <tr style="border-bottom: 1px solid #f7fafc;">
                                        <td style="color: #718096; font-weight: 500;">Circle:</td>
                                        <td>${rmaDoc.circle || 'N/A'}</td>
                                    </tr>
                                    <tr style="border-bottom: 1px solid #f7fafc;">
                                        <td style="color: #718096; font-weight: 500;">Receiving Date:</td>
                                        <td>${rmaDoc.receiving_date || 'N/A'}</td>
                                    </tr>
                                    <tr style="border-bottom: 1px solid #f7fafc;">
                                        <td style="color: #718096; font-weight: 500;">Material Receipt ID:</td>
                                        <td style="font-weight: 600; color: #2b6cb0;">${rmaDoc.material_receipt || 'N/A'}</td>
                                    </tr>
                                    <tr style="border-bottom: 1px solid #f7fafc;">
                                        <td style="color: #718096; font-weight: 500;">Material Request ID:</td>
                                        <td style="font-weight: 600; color: #2b6cb0; padding: 4px 6px;">
                                            ${
                                                Array.isArray(rmaDoc.submitted_material_receipt) && rmaDoc.submitted_material_receipt.length > 0
                                                    ? rmaDoc.submitted_material_receipt.map(item => {
                                                        return item.stock_entry || item.name || Object.values(item).find(v => typeof v === 'string' && v.startsWith('MAT')) || 'N/A';
                                                      }).join(', ')
                                                    : (rmaDoc.submitted_material_receipt || 'N/A')
                                            }
                                        </td>
                                    </tr>
                                    <tr style="border-bottom: 1px solid #f7fafc;">
                                        <td style="color: #718096; font-weight: 500;">Material Issue ID:</td>
                                        <td style="font-weight: 600; color: #2b6cb0; padding: 4px 6px;">
                                            ${
                                                Array.isArray(rmaDoc.material_issue) && rmaDoc.material_issue.length > 0
                                                    ? rmaDoc.material_issue.map(item => {
                                                        return item.stock_entry || item.name || Object.values(item).find(v => typeof v === 'string' && v.startsWith('MAT')) || 'N/A';
                                                      }).join(', ')
                                                    : (rmaDoc.material_issue || 'N/A')
                                            }
                                        </td>
                                    </tr>
                                    <tr style="border-bottom: 1px solid #f7fafc;">
                                        <td style="color: #718096; font-weight: 500;">Components Used:</td>
                                        <td>${rmaDoc.component_used_init || 'N/A'}</td>
                                    </tr>
                                    <tr>
                                        <td colspan="2" style="padding-top: 5px !important;">
                                            <div style="font-weight: 500; color: #718096; margin-bottom: 2px;">Receiving Remarks:</div>
                                            <!-- Reduced size of display box for minimal/brief input text -->
                                            <div style="background: #f7fafc; border: 1px solid #edf2f7; border-radius: 4px; padding: 4px 6px; font-size: 10.5px; color: #4a5568; max-height: 38px; overflow-y: auto; white-space: pre-wrap; line-height: 1.3;">
                                                ${rmaDoc.receiving_remarks || 'No receiving remarks.'}
                                            </div>
                                        </td>
                                    </tr>
                                </tbody>
                            </table>
                        </div>

                        <!-- Right Panel: Repair Model -->
                        <div style="flex: 1; min-width: 280px; max-width: 100%;">
                            <div class="section-title"><b>Repair Model</b></div>
                            <table style="width: 100%; border-collapse: collapse; font-size: 12px; margin-bottom: 15px;">
                                <tbody>
                                    <tr style="border-bottom: 1px solid #f7fafc;">
                                        <td style="width: 45%; color: #718096; font-weight: 500;">Assign To:</td>
                                        <td style="font-weight: 600; color: #2d3748;">${rmaDoc.assigned_to || rmaDoc.repaired_by || 'N/A'}</td>
                                    </tr>
                                    <tr style="border-bottom: 1px solid #f7fafc;">
                                        <td style="color: #718096; font-weight: 500;">RMA Assigned Date:</td>
                                        <td>${rmaDoc.rma_assigned_date || 'N/A'}</td>
                                    </tr>
                                    <tr style="border-bottom: 1px solid #f7fafc;">
                                        <td style="color: #718096; font-weight: 500;">Status Update Date:</td>
                                        <td>${rmaDoc.repaired_date || 'N/A'}</td>
                                    </tr>
                                    <tr style="border-bottom: 1px solid #f7fafc;">
                                        <td style="color: #718096; font-weight: 500;">Fault Found:</td>
                                        <td style="font-weight: 600; color: #e53e3e;">${rmaDoc.fault_found || 'N/A'}</td>
                                    </tr>
                                    <tr style="border-bottom: 1px solid #f7fafc;">
                                        <td style="color: #718096; font-weight: 500;">Total Repair Time:</td>
                                        <td>${rmaDoc.total_repair_time || 'N/A'}</td>
                                    </tr>
                                    <tr>
                                        <td colspan="2" style="padding-top: 10px !important;">
                                            <div style="font-weight: 500; color: #718096; margin-bottom: 2px;">Repair Remarks:</div>
                                            <div style="background: #f7fafc; border: 1px solid #edf2f7; border-radius: 4px; padding: 6px 8px; font-size: 11px; color: #4a5568; max-height: 80px; overflow-y: auto; white-space: pre-wrap;">
                                                ${rmaDoc.repair_remarks || 'No repair remarks.'}
                                            </div>
                                        </td>
                                    </tr>
                                </tbody>
                            </table>
                        </div>

                    </div>
                </div>
            `;

            let d = new frappe.ui.Dialog({
                title: __("RMA BIN Record Details: {0}", [rmaDoc.name]),
                size: "large",
                fields: [
                    {
                        fieldtype: "HTML",
                        fieldname: "details_content"
                    }
                ]
            });

            d.fields_dict.details_content.$wrapper.html(details_html);
            d.show();

        } catch (err) {
            frappe.dom.unfreeze();
            console.error("Error fetching RMA details:", err);
            frappe.msgprint(__("Unable to load full RMA details. Please check the console log."));
        }
    }
});

// Enhanced link formatter for Employee fields
frappe.form.link_formatters['Employee'] = function (value, doc) {
    if (!value) return value;

    if (doc.assigned_to === value && doc.assigned_to_name) {
        return value + ' - ' + doc.assigned_to_name;
    }

    if (doc.quality_check_assign_to === value && doc.quality_check_assigned_to_name) {
        return value + ' - ' + doc.quality_check_assigned_to_name;
    }

    return value;
};

// Override grid rendering for better display
$(document).on('app_ready', function () {
    if (frappe.ui.form.GridRow) {
        const original_render = frappe.ui.form.GridRow.prototype.render_row;

        frappe.ui.form.GridRow.prototype.render_row = function () {
            original_render.apply(this, arguments);

            if (this.doc.doctype === "Quality Check Table") {
                if (this.doc.quality_check_assign_to && this.doc.quality_check_assigned_to_name) {
                    let qc_cell = this.row.find('[data-fieldname="quality_check_assign_to"]');
                    if (qc_cell.length) {
                        qc_cell.text(`${this.doc.quality_check_assign_to} - ${this.doc.quality_check_assigned_to_name}`);
                    }
                }

                if (this.doc.assigned_to && this.doc.assigned_to_name) {
                    let assigned_cell = this.row.find('[data-fieldname="assigned_to"]');
                    if (assigned_cell.length) {
                        assigned_cell.text(`${this.doc.assigned_to} - ${this.doc.assigned_to_name}`);
                    }
                }
            }
        };
    }
});














// Copyright (c) 2025, Anantdv and contributors
// For license information, please see license.txt


// function setup_field_filters(frm) {
//     frm.set_query("lot_no", function () {
//         let filters = {};

//         if (frm.doc.customer) {
//             filters.customer = frm.doc.customer;
//         }

//         return {
//             filters: filters,
//             ignore_user_permissions: 1,
//             order_by: "creation desc"
//         };
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
//     let filters = get_active_filters_array(frm);
//     if (filters.length > 0) {
//         return ` (Filtered: ${filters.join(', ')})`;
//     }
//     return '';
// }


// function get_active_filters(frm) {
//     let filters = get_active_filters_array(frm);
//     if (filters.length > 0) {
//         return ` with filters: ${filters.join(', ')}`;
//     }
//     return '';
// }


// // Main load function - matching Repair and Return pattern
// async function load_quality_check_data(frm) {
//     frappe.call({
//         method: "rms.rms.doctype.quality_check.quality_check.get_quality_check_data",
//         args: {
//             customer: frm.doc.customer || '',
//             lot_no: frm.doc.lot_no || '',
//             warranty_status: frm.doc.warranty_status || '',
//             circle: frm.doc.circle || '',
//             rma_id: frm.doc.rma_id || '',
//             repair_status: frm.doc.repair_status || ''
//         },
//         callback: async function (r) {
//             console.log("RMA Data Response:", r);
//             frm.clear_table("quality_check");
//             frm.refresh_field("quality_check");

//             if (r.message && r.message.length > 0) {
//                 frm.clear_table("quality_check");

//                 console.log("Loaded RMA data:", r.message);
//                 localStorage.setItem("quality_check_snapshot", JSON.stringify(r.message));

//                 for (const row of r.message) {
//                     let child = frm.add_child("quality_check");

//                     // Map basic fields from RMA BIN to child table
//                     child.lot_no = row.lot_no;
//                     child.rma_id = row.rma_id || row.name;
//                     child.customer = (row.customer || '').substring(0, 140);
//                     child.serial_no = row.serial_no;
//                     child.warranty_st = row.warranty_status;
//                     child.repair_status = row.rma_id_status;

//                     let latest_rma = await frappe.db.get_value(
//                         "RMA BIN",
//                         row.rma_id || row.name,
//                         "repair_remarks"
//                     );

//                     child.repair_remarks = latest_rma?.message?.repair_remarks || '';
//                     child.warranty_status = row.warranty_status;
//                     child.quality_check_pass = row.quality_check_pass;
//                     child.quality_check_done = row.quality_check_done;
//                     child.quality_tat = row.total_quality_time || '';

//                     // Parse Assigned To (repaired_by)
//                     if (row.repaired_by) {
//                         const assignedToData = await parseEmployeeString(row.repaired_by);
//                         child.assigned_to = assignedToData.id;
//                         child.assigned_to_name = assignedToData.name;
//                     } else {
//                         child.assigned_to = '';
//                         child.assigned_to_name = '';
//                     }

//                     // Parse Quality Check Assigned To
//                     if (row.quality_check_assigned_to && row.quality_check_assigned_to !== null) {
//                         const qcAssignedData = await parseEmployeeString(row.quality_check_assigned_to);
//                         child.quality_check_assign_to = qcAssignedData.id;
//                         child.quality_check_assigned_to_name = qcAssignedData.name;
//                     } else {
//                         child.quality_check_assign_to = '';
//                         child.quality_check_assigned_to_name = '';
//                     }

//                     // Store the RMA BIN name for updating later
//                     child.rma_bin_name = row.rma_id || row.name;
//                     child.receiving_remarks = row.receiving_remarks;

//                     // Fetch component_details from RMA BIN
//                     try {
//                         let rma_bin_doc = await frappe.db.get_doc("RMA BIN", row.rma_id || row.name);
//                         if (rma_bin_doc && rma_bin_doc.component_details && rma_bin_doc.component_details.length) {
//                             rma_bin_doc.component_details.forEach(function (c) {
//                                 let comp_row = frappe.model.add_child(child, "Components Used", "component_details");
//                                 comp_row.component_name = c.component_name;
//                                 comp_row.qty = c.qty;
//                             });
//                         }
//                     } catch (e) {
//                         console.error("Error fetching component_details for", row.rma_id, e);
//                     }

//                     // Existing quality check data if available
//                     child.quality_check_date = row.quality_check_assigned_date || '';

//                     if (row.receiving_date) {
//                         child.receiving_date = row.receiving_date;
//                         let today_date = frappe.datetime.get_today();
//                         let diff = frappe.datetime.get_diff(today_date, row.receiving_date);
//                         child.tat = diff;
//                     }

//                     if (row.quality_check_done_date) {
//                         child.quality_check_done_date = row.quality_check_done_date;
//                     }
//                 }

//                 frm.clear_table("component_details");
//                 for (const row of r.message) {
//                     try {
//                         let rma_bin_doc = await frappe.db.get_doc("RMA BIN", row.rma_id || row.name);
//                         if (rma_bin_doc && rma_bin_doc.component_details && rma_bin_doc.component_details.length) {
//                             rma_bin_doc.component_details.forEach(function (c) {
//                                 let comp_row = frm.add_child("component_details");
//                                 comp_row.component_name = c.component_name;
//                                 comp_row.qty = c.qty;
//                             });
//                         }
//                     } catch (e) {
//                         console.error("Error fetching component_details for", row.rma_id, e);
//                     }
//                 }
//                 frm.refresh_field("component_details");

//                 frm.refresh_field("quality_check");

//                 // Refresh grid to apply formatters
//                 setTimeout(() => {
//                     if (frm.fields_dict.quality_check && frm.fields_dict.quality_check.grid) {
//                         frm.fields_dict.quality_check.grid.refresh();
//                     }
//                 }, 100);

//                 let filter_info = get_filter_info(frm);
//                 frappe.show_alert({
//                     message: `Loaded ${r.message.length} RMA records${filter_info}`,
//                     indicator: 'green'
//                 });

//             } else {
//                 frm.clear_table("quality_check");
//                 frm.refresh_field("quality_check");

//                 let filter_text = get_active_filters(frm);
//                 frappe.show_alert({
//                     message: `No RMA data found${filter_text}`,
//                     indicator: 'orange'
//                 });
//             }
//         },
//         error: function (r) {
//             console.error("Error loading RMA data:", r);
//             frappe.show_alert({
//                 message: 'Error loading RMA data',
//                 indicator: 'red'
//             });
//         }
//     });
// }

// // Helper function to refresh employee display names after save
// async function refreshEmployeeDisplayNames(frm, updatedData) {
//     for (let row of frm.doc.quality_check) {
//         let updatedRow = updatedData.find(u => u.rma_id === row.rma_id);
//         if (!updatedRow) continue;

//         if (updatedRow.repaired_by) {
//             const assignedToData = await parseEmployeeString(updatedRow.repaired_by);
//             row.assigned_to_name = assignedToData.name;
//         }

//         if (updatedRow.quality_check_assigned_to) {
//             const qcAssignedData = await parseEmployeeString(updatedRow.quality_check_assigned_to);
//             row.quality_check_assigned_to_name = qcAssignedData.name;
//         }
//     }

//     frm.refresh_field("quality_check");

//     setTimeout(() => {
//         if (frm.fields_dict.quality_check && frm.fields_dict.quality_check.grid) {
//             frm.fields_dict.quality_check.grid.refresh();

//             frm.fields_dict.quality_check.grid.grid_rows.forEach(grid_row => {
//                 if (grid_row.doc.doctype === "Quality Check Table") {
//                     if (grid_row.doc.quality_check_assign_to && grid_row.doc.quality_check_assigned_to_name) {
//                         let qc_cell = grid_row.row.find('[data-fieldname="quality_check_assign_to"]');
//                         if (qc_cell.length) {
//                             qc_cell.text(`${grid_row.doc.quality_check_assign_to} - ${grid_row.doc.quality_check_assigned_to_name}`);
//                         }
//                     }

//                     if (grid_row.doc.assigned_to && grid_row.doc.assigned_to_name) {
//                         let assigned_cell = grid_row.row.find('[data-fieldname="assigned_to"]');
//                         if (assigned_cell.length) {
//                             assigned_cell.text(`${grid_row.doc.assigned_to} - ${grid_row.doc.assigned_to_name}`);
//                         }
//                     }
//                 }
//             });
//         }
//     }, 200);
// }

// async function parseEmployeeString(employeeString) {
//     if (!employeeString) {
//         return { id: '', name: '' };
//     }

//     if (employeeString.includes(' - ')) {
//         const parts = employeeString.split(' - ');
//         return { id: parts[0], name: parts[1] || '' };
//     }

//     try {
//         const byNameResult = await frappe.db.get_list('Employee', {
//             filters: [['employee_name', '=', employeeString]],
//             fields: ['name', 'employee_name'],
//             limit: 1
//         });

//         if (byNameResult && byNameResult.length > 0) {
//             return {
//                 id: byNameResult[0].name,
//                 name: byNameResult[0].employee_name
//             };
//         }

//         const byIdResult = await frappe.db.get_value('Employee', employeeString, 'employee_name');
//         if (byIdResult && byIdResult.message && byIdResult.message.employee_name) {
//             return {
//                 id: employeeString,
//                 name: byIdResult.message.employee_name
//             };
//         }
//     } catch (err) {
//         console.error('Error fetching employee data for:', employeeString, err);
//     }

//     return { id: employeeString, name: '' };
// }

// // Main form events
// frappe.ui.form.on('Quality Check', {

//     refresh: function (frm) {
//         // Inject styles safely
//         try {
//             frappe.dom.inject_style(`...your css...`);
//         } catch (e) {
//             console.warn("Style injection failed", e);
//         }

//         // Always remove then re-add to avoid duplication issues
//         frm.remove_custom_button(__('Get Data'));

//         let btn = frm.add_custom_button(__('Get Data'), function () {
//             load_quality_check_data(frm);
//         });
//         btn.addClass('btn-primary');

//         setup_field_filters(frm);

//         frm.set_query("quality_check_assign_to", "quality_check", function () {
//             return { filters: { "status": "Active" } };
//         });
//     },


//     // refresh: function (frm) {
//     //     console.log("refresh called")

//     //     // Inject formal, non-overflowing CSS styles
//     //     frappe.dom.inject_style(`
//     //         /* Style buttons inside table to look formal, blue and prevent spilling outside boundaries */
//     //         .grid-row .btn[data-fieldname="view_details"],
//     //         .grid-row .btn[data-fieldname="view_remarks"] {
//     //             background-color: #1b66ec !important;
//     //             color: #ffffff !important;
//     //             font-weight: 500 !important;
//     //             padding: 3px 6px !important;
//     //             font-size: 11px !important;
//     //             border-radius: 4px !important;
//     //             border: none !important;
//     //             max-width: 100% !important;
//     //             overflow: hidden !important;
//     //             text-overflow: ellipsis !important;
//     //             white-space: nowrap !important;
//     //             box-shadow: 0 1px 2px rgba(0,0,0,0.1) !important;
//     //         }
//     //         .grid-row .btn[data-fieldname="view_details"]:hover,
//     //         .grid-row .btn[data-fieldname="view_remarks"]:hover {
//     //             background-color: #0b4ec5 !important;
//     //         }
//     //         .rma-details-modal td {
//     //             padding: 4px 6px !important;
//     //         }
//     //         .rma-details-modal .section-title {
//     //             font-size: 12px;
//     //             font-weight: 700;
//     //             color: #2b6cb0;
//     //             border-bottom: 2px solid #e2e8f0;
//     //             padding-bottom: 4px;
//     //             margin-bottom: 8px;
//     //             text-transform: uppercase;
//     //             letter-spacing: 0.5px;
//     //         }
//     //     `);

//     //     // Remove existing Get Data button if it exists
//     //     if (frm.custom_buttons["Get Data"]) {
//     //         frm.remove_custom_button("Get Data");
//     //     }

//     //     // Add Get Data button
//     //     frm.add_custom_button(__('Get Data'), function () {
//     //         load_quality_check_data(frm);
//     //     }).addClass('btn-primary');

//     //     // Setup field filters
//     //     setup_field_filters(frm);

//     //     frm.set_query("quality_check_assign_to", "quality_check", function () {
//     //         return {
//     //             filters: {
//     //                 "status": "Active",
//     //             }
//     //         };
//     //     });
//     // },

//     customer: function (frm) {
//         if (frm.doc.lot_no) {
//             frm.set_value('lot_no', '');
//         }
//     },

//     rma_id: function (frm) {
//         console.log("RMA ID changed to:", frm.doc.rma_id);
//     },

//     before_save: async function (frm) {
//         console.log("before save called");

//         let oldData = JSON.parse(localStorage.getItem("quality_check_snapshot") || "[]");
//         let local_storage_val = [];

//         for (let row of frm.doc.quality_check) {
//             let original = oldData.find(o => o.rma_id === row.rma_id);

//             if (!original) continue;

//             let hasSimpleChange = false;
//             let updates = {};

//             function normalize(val) {
//                 if (val === undefined || val === null) return "";
//                 return val;
//             }
//             if (normalize(row.quality_check_assign_to) !== normalize(original.quality_check_assigned_to?.split(' - ')[0]) || original.quality_check_assigned_to === undefined || original.quality_check_assigned_to === null) {

//                 const qcAssignedData = await parseEmployeeString(row.quality_check_assign_to);
//                 updates.quality_check_assigned_to = `${qcAssignedData.id} - ${qcAssignedData.name}`;

//                 let rmaDoc = await frappe.db.get_doc("RMA BIN", row.rma_id);
//                 rmaDoc.rma_tracking_status.push({
//                     status: "RMA Q/C Assigned",
//                     timestamp: frappe.datetime.now_datetime(),
//                     modified_by1: frappe.session.user,
//                     remarks: `Quality Check Assigned to  ${row.quality_check_assign_to}`,
//                     rma_status: row.repair_status
//                 });
//                 await frappe.call({
//                     method: "frappe.client.save",
//                     args: { doc: rmaDoc }
//                 });
//                 hasSimpleChange = true;
//             }

//             if (row.quality_check_done !== original.quality_check_done) {
//                 updates.quality_check_done = row.quality_check_done
//                 hasSimpleChange = true
//             }

//             if (normalize(row.quality_check_date) !== normalize(original.quality_check_assigned_date)) {
//                 updates.quality_check_assigned_date = row.quality_check_date
//                 hasSimpleChange = true
//             }

//             if (normalize(row.repair_status) !== normalize(original.rma_id_status)) {
//                 updates.rma_id_status = row.repair_status;
//                 hasSimpleChange = true
//             }

//             if (normalize(row.repair_remarks) !== normalize(original.repair_remarks)) {
//                 updates.repair_remarks = row.repair_remarks;
//                 hasSimpleChange = true
//             }


//             let hasRepairStatusChanged = normalize(row.repair_status) !== normalize(original?.rma_id_status);
//             let remarksChanged = normalize(row.repair_remarks) !== normalize(original.repair_remarks);

//             if (hasSimpleChange) {
//                 await frappe.db.set_value("RMA BIN", row.rma_id, updates);
//             }

//             if (remarksChanged) {
//                 let rmaDoc = await frappe.db.get_doc("RMA BIN", row.rma_id);
//                 rmaDoc.remarks.push({
//                     repair_remarks: row.repair_remarks,
//                     timestamp: frappe.datetime.now_datetime()
//                 });
//                 rmaDoc.last_updated_on = frappe.datetime.now_datetime();
//                 await frappe.call({
//                     method: "frappe.client.save",
//                     args: { doc: rmaDoc }
//                 });
//             }

//             if (hasRepairStatusChanged) {
//                 let rmaDoc = await frappe.db.get_doc("RMA BIN", row.rma_id);
//                 rmaDoc.rma_status.push({
//                     repair_status: row.repair_status,
//                     timestamp: frappe.datetime.now_datetime()
//                 });
//                 rmaDoc.last_updated_on = frappe.datetime.now_datetime();
//                 await frappe.call({
//                     method: "frappe.client.save",
//                     args: { doc: rmaDoc }
//                 });
//             }


//             const rma_bin_data = await frappe.db.get_doc("RMA BIN", row.rma_id);
//             local_storage_val.push(rma_bin_data);
//         }

//         localStorage.setItem("quality_check_snapshot", JSON.stringify(local_storage_val));
//         await refreshEmployeeDisplayNames(frm, local_storage_val);
//     },


//     onload_post_render: function (frm) {
//         localStorage.removeItem("quality_check_snapshot");

//         frm.set_value("customer", "")
//         frm.set_value("lot_no", "")
//         frm.clear_table("quality_check");
//         frm.refresh_field("quality_check")
//     },

//     validate: function (frm) {
//         let errors = [];

//         (frm.doc.quality_check || []).forEach((row, idx) => {

//             if (row.receiving_date && row.quality_check_date) {

//                 let receiving = frappe.datetime.str_to_obj(row.receiving_date);
//                 let qc_date = frappe.datetime.str_to_obj(row.quality_check_date);

//                 if (qc_date < receiving) {
//                     frappe.throw({
//                         title: __("Invalid Quality Check Date"),
//                         message: __(
//                             "Quality Check Date cannot be before Receiving Date.<br><br>" +
//                             "<b>Row:</b> {0}<br>" +
//                             "<b>Receiving Date:</b> {1}<br>" +
//                             "<b>Quality Check Date:</b> {2}",
//                             [idx + 1, row.receiving_date, row.quality_check_date]
//                         )
//                     });
//                 }
//             }

//             let assignedToId = row.assigned_to || '';
//             let qcAssignToId = row.quality_check_assign_to || '';

//             if (assignedToId && qcAssignToId && assignedToId === qcAssignToId) {
//                 errors.push(
//                     `• Row ${idx + 1} (RMA ID <b>${row.rma_id || 'Unknown'}</b>): Repair and Quality Check Engineer cannot be the same.`
//                 );
//             }

//         });

//         if (errors.length > 0) {
//             frappe.throw(`
//             <p>Error</p>
//             ${errors.join("<br>")}
//         `);
//         }

//         frm.refresh_field("quality_check");
//     }

// });


// // Consolidated Child Table specific events
// frappe.ui.form.on("Quality Check table", {
//     quality_check_assign_to: function (frm, cdt, cdn) {
//         let row = locals[cdt][cdn];

//         row.quality_check_date = frappe.datetime.get_today();
//         frm.refresh_field("quality_check");

//         if (row.quality_check_assign_to) {
//             frappe.model.set_value(cdt, cdn, 'quality_check_date', frappe.datetime.get_today());

//             frappe.db.get_doc('Employee', row.quality_check_assign_to).then(item => {
//                 frappe.model.set_value(cdt, cdn, 'quality_check_assigned_to_name', item.employee_name);
//             }).catch(err => {
//                 console.error('Error fetching employee:', err);
//                 frappe.model.set_value(cdt, cdn, 'quality_check_assigned_to_name', '');
//             });
//         } else {
//             frappe.model.set_value(cdt, cdn, 'quality_check_date', '');
//         }
//     },

//     form_render: function (frm, cdt, cdn) {
//         let row = locals[cdt][cdn];
//         let grid_row = frm.fields_dict.quality_check.grid.grid_rows_by_docname[cdn];

//         if (grid_row) {
//             if (row.quality_check_assign_to && row.quality_check_assigned_to_name) {
//                 let field = grid_row.get_field('quality_check_assign_to');
//                 if (field && field.$input) {
//                     field.$input.val(`${row.quality_check_assign_to} - ${row.quality_check_assigned_to_name}`);
//                 }
//             }

//             if (row.assigned_to && row.assigned_to_name) {
//                 let field = grid_row.get_field('assigned_to');
//                 if (field && field.$input) {
//                     field.$input.val(`${row.assigned_to} - ${row.assigned_to_name}`);
//                 }
//             }
//         }
//     },

//     view_remarks: async function (frm, cdt, cdn) {
//         let row = locals[cdt][cdn];
//         if (!row.rma_id) {
//             frappe.msgprint("RMA ID not found.");
//             return;
//         }

//         try {
//             let rmaDoc = await frappe.db.get_doc("RMA BIN", row.rma_id);
//             let remarks_html = "";

//             if (rmaDoc.remarks && rmaDoc.remarks.length > 0) {
//                 rmaDoc.remarks.slice().reverse().forEach(function (r) {
//                     remarks_html += `
//                         <div style="padding:12px; margin-bottom:10px; border:1px solid #e3e3e3; border-radius:8px; background:#fafafa;">
//                             <div style="display:flex; justify-content:space-between; font-size:12px; color:#6c757d; margin-bottom:6px;">
//                                 <span>👤 ${r.modified_by || r.owner || "System"}</span>
//                                 <span>🕒 ${r.timestamp || ""}</span>
//                             </div>
//                             <div style="font-size:14px; color:#333;">
//                                 ${r.repair_remarks || ""}
//                             </div>
//                         </div>
//                     `;
//                 });
//             } else {
//                 remarks_html = "<p>No previous remarks found.</p>";
//             }

//             let d = new frappe.ui.Dialog({
//                 title: "Previous Remarks - " + row.rma_id,
//                 size: "large",
//                 fields: [
//                     {
//                         fieldtype: "HTML",
//                         fieldname: "remarks_content"
//                     }
//                 ]
//             });

//             d.fields_dict.remarks_content.$wrapper.html(remarks_html);
//             d.show();

//         } catch (err) {
//             console.error("Error fetching remarks:", err);
//             frappe.msgprint("Unable to load remarks.");
//         }
//     },

//     view_details: async function (frm, cdt, cdn) {
//         let row = locals[cdt][cdn];
//         if (!row.rma_id) {
//             frappe.msgprint(__("RMA ID not found."));
//             return;
//         }

//         frappe.dom.freeze(__("Loading Details..."));

//         try {
//             let rmaDoc = await frappe.db.get_doc("RMA BIN", row.rma_id);
//             console.log("material_issue raw:", JSON.stringify(rmaDoc.material_issue));
//             frappe.dom.unfreeze();

//             // Components Render Block helper
//             const getComponentsHTML = (components) => {
//                 if (!components || components.length === 0) {
//                     return `<p class="text-muted" style="font-size: 11px; font-style: italic; margin-bottom: 0;">No components recorded for this RMA.</p>`;
//                 }
//                 let table_rows = components.map(c => `
//                     <tr>
//                         <td style="padding: 6px; vertical-align: middle;">${c.component_name || 'N/A'}</td>
//                         <td style="padding: 6px; text-align: center; font-weight: bold; width: 70px; vertical-align: middle;">${c.qty || 0}</td>
//                     </tr>
//                 `).join('');

//                 return `
//                     <div class="table-responsive">
//                         <table class="table table-bordered table-sm mb-0" style="font-size: 11px; border-radius: 4px; overflow: hidden; width: 100%;">
//                             <thead style="background-color: #f8f9fa;">
//                                 <tr>
//                                     <th style="padding: 6px;">Component</th>
//                                     <th style="padding: 6px; text-align: center;">Qty</th>
//                                 </tr>
//                             </thead>
//                             <tbody>
//                                 ${table_rows}
//                             </tbody>
//                         </table>
//                     </div>
//                 `;
//             };

//             // Formal Dialog HTML Markup
//             let details_html = `
//                 <div class="rma-details-modal" style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; color: #2d3748; padding: 5px;">
                    
//                     <!-- Title & Header section -->
//                     <div style="background: #f7fafc; border: 1px solid #e2e8f0; border-radius: 6px; padding: 12px; margin-bottom: 15px;">
//                         <div style="display: flex; justify-content: space-between; align-items: center; flex-wrap: wrap;">
//                             <div>
//                                 <span style="font-size: 10px; text-transform: uppercase; color: #718096; font-weight: 600; display: block; margin-bottom: 2px;">RMA Record</span>
//                                 <span style="font-size: 16px; font-weight: 700; color: #1a202c;">${rmaDoc.name}</span>
//                             </div>
//                             <div>
//                                 <span style="font-size: 10px; text-transform: uppercase; color: #718096; font-weight: 600; display: block; margin-bottom: 2px; text-align: right;">Status</span>
//                                 <span style="background-color: #2b6cb0; color: #ffffff; padding: 4px 10px; font-size: 11px; font-weight: 600; border-radius: 4px; display: inline-block;">
//                                     ${rmaDoc.rma_id_status || rmaDoc.repair_status || 'Unknown'}
//                                 </span>
//                             </div>
//                         </div>
//                     </div>

//                     <!-- Layout split: Receiving Model (Left) & Repair Model (Right) -->
//                     <div style="display: flex; gap: 20px; flex-wrap: wrap;">
                        
//                         <!-- Left Panel: Receiving Model -->
//                         <div style="flex: 1; min-width: 280px; max-width: 100%;">
//                             <div class="section-title">Receiving Model</div>
//                             <table style="width: 100%; border-collapse: collapse; font-size: 12px; margin-bottom: 15px;">
//                                 <tbody>
//                                     <tr style="border-bottom: 1px solid #f7fafc;">
//                                         <td style="width: 45%; color: #718096; font-weight: 500;">Customer:</td>
//                                         <td style="font-weight: 600; color: #2d3748;">${rmaDoc.customer || 'N/A'}</td>
//                                     </tr>
//                                     <tr style="border-bottom: 1px solid #f7fafc;">
//                                         <td style="color: #718096; font-weight: 500;">Lot No.:</td>
//                                         <td>${rmaDoc.lot_no || 'N/A'}</td>
//                                     </tr>
//                                     <tr style="border-bottom: 1px solid #f7fafc;">
//                                         <td style="color: #718096; font-weight: 500;">Make / Model:</td>
//                                         <td>${rmaDoc.make || 'N/A'} / ${rmaDoc.model_no || 'N/A'}</td>
//                                     </tr>
//                                     <tr style="border-bottom: 1px solid #f7fafc;">
//                                         <td style="color: #718096; font-weight: 500;">Part No.:</td>
//                                         <td>${rmaDoc.part_no || 'N/A'}</td>
//                                     </tr>
//                                     <tr style="border-bottom: 1px solid #f7fafc;">
//                                         <td style="color: #718096; font-weight: 500;">Serial No.:</td>
//                                         <td style="font-weight: 600; color: #2d3748;">${rmaDoc.serial_no || 'N/A'}</td>
//                                     </tr>
//                                     <tr style="border-bottom: 1px solid #f7fafc;">
//                                         <td style="color: #718096; font-weight: 500;">Circle:</td>
//                                         <td>${rmaDoc.circle || 'N/A'}</td>
//                                     </tr>
//                                     <tr style="border-bottom: 1px solid #f7fafc;">
//                                         <td style="color: #718096; font-weight: 500;">Receiving Date:</td>
//                                         <td>${rmaDoc.receiving_date || 'N/A'}</td>
//                                     </tr>
//                                     <tr style="border-bottom: 1px solid #f7fafc;">
//                                         <td style="color: #718096; font-weight: 500;">Material Receipt ID:</td>
//                                         <td style="font-weight: 600; color: #2b6cb0;">${rmaDoc.material_receipt || 'N/A'}</td>
//                                     </tr>
//                                     <tr style="border-bottom: 1px solid #f7fafc;">
//                                         <td style="color: #718096; font-weight: 500;">Material Request ID:</td>
//                                         <td>${rmaDoc.material_request || rmaDoc.material_request_transfer || 'N/A'}</td>
//                                     </tr>
//                                     <tr style="border-bottom: 1px solid #f7fafc;">
//                                         <td style="color: #718096; font-weight: 500;">Material Issue ID:</td>
//                                         <td style="font-weight: 600; color: #2b6cb0; padding: 4px 6px;">
//     ${
//         Array.isArray(rmaDoc.material_issue) && rmaDoc.material_issue.length > 0
//             ? rmaDoc.material_issue.map(item => {
//                 return item.stock_entry || item.name || Object.values(item).find(v => typeof v === 'string' && v.startsWith('MAT')) || 'N/A';
//               }).join(', ')
//             : (rmaDoc.material_issue || 'N/A')
//     }
// </td>
//                                     </tr>
//                                     <tr style="border-bottom: 1px solid #f7fafc;">
//                                         <td style="color: #718096; font-weight: 500;">Components Used:</td>
//                                         <td>${rmaDoc.component_used_init || 'N/A'}</td>
//                                     </tr>
//                                     <tr style="border-bottom: 1px solid #f7fafc;">
//                                         <td style="color: #718096; font-weight: 500;">Warehouse:</td>
//                                         <td>${rmaDoc.warehouse || 'N/A'}</td>
//                                     </tr>
//                                     <tr>
//                                         <td colspan="2" style="padding-top: 10px !important;">
//                                             <div style="font-weight: 500; color: #718096; margin-bottom: 2px;">Receiving Remarks:</div>
//                                             <div style="background: #f7fafc; border: 1px solid #edf2f7; border-radius: 4px; padding: 6px 8px; font-size: 11px; color: #4a5568; max-height: 80px; overflow-y: auto; white-space: pre-wrap;">
//                                                 ${rmaDoc.receiving_remarks || 'No receiving remarks.'}
//                                             </div>
//                                         </td>
//                                     </tr>
//                                 </tbody>
//                             </table>
//                         </div>

//                         <!-- Right Panel: Repair Model & Components -->
//                         <div style="flex: 1; min-width: 280px; max-width: 100%;">
//                             <div class="section-title">Repair Model</div>
//                             <table style="width: 100%; border-collapse: collapse; font-size: 12px; margin-bottom: 15px;">
//                                 <tbody>
//                                     <tr style="border-bottom: 1px solid #f7fafc;">
//                                         <td style="width: 45%; color: #718096; font-weight: 500;">Assign To:</td>
//                                         <td style="font-weight: 600; color: #2d3748;">${rmaDoc.assigned_to || rmaDoc.repaired_by || 'N/A'}</td>
//                                     </tr>
//                                     <tr style="border-bottom: 1px solid #f7fafc;">
//                                         <td style="color: #718096; font-weight: 500;">RMA Assigned Date:</td>
//                                         <td>${rmaDoc.rma_assigned_date || 'N/A'}</td>
//                                     </tr>
//                                     <tr style="border-bottom: 1px solid #f7fafc;">
//                                         <td style="color: #718096; font-weight: 500;">Status Update Date:</td>
//                                         <td>${rmaDoc.repaired_date || 'N/A'}</td>
//                                     </tr>
//                                     <tr style="border-bottom: 1px solid #f7fafc;">
//                                         <td style="color: #718096; font-weight: 500;">Fault Found:</td>
//                                         <td style="font-weight: 600; color: #e53e3e;">${rmaDoc.fault_found || 'N/A'}</td>
//                                     </tr>
//                                     <tr>
//                                         <td colspan="2" style="padding-top: 10px !important;">
//                                             <div style="font-weight: 500; color: #718096; margin-bottom: 2px;">Repair Remarks:</div>
//                                             <div style="background: #f7fafc; border: 1px solid #edf2f7; border-radius: 4px; padding: 6px 8px; font-size: 11px; color: #4a5568; max-height: 80px; overflow-y: auto; white-space: pre-wrap;">
//                                                 ${rmaDoc.repair_remarks || 'No repair remarks.'}
//                                             </div>
//                                         </td>
//                                     </tr>
//                                 </tbody>
//                             </table>

//                             <div class="section-title" style="font-size: 11px; margin-top: 10px; border-bottom: 1px solid #e2e8f0; padding-bottom: 2px; text-transform: uppercase;">Components Selected</div>
//                             <div style="margin-top: 6px;">
//                                 ${getComponentsHTML(rmaDoc.component_details)}
//                             </div>
//                         </div>

//                     </div>
//                 </div>
//             `;

//             let d = new frappe.ui.Dialog({
//                 title: __("RMA BIN Record Details: {0}", [rmaDoc.name]),
//                 size: "large",
//                 fields: [
//                     {
//                         fieldtype: "HTML",
//                         fieldname: "details_content"
//                     }
//                 ]
//             });

//             d.fields_dict.details_content.$wrapper.html(details_html);
//             d.show();

//         } catch (err) {
//             frappe.dom.unfreeze();
//             console.error("Error fetching RMA details:", err);
//             frappe.msgprint(__("Unable to load full RMA details. Please check the console log."));
//         }
//     }
// });

// // Enhanced link formatter for Employee fields
// frappe.form.link_formatters['Employee'] = function (value, doc) {
//     if (!value) return value;

//     if (doc.assigned_to === value && doc.assigned_to_name) {
//         return value + ' - ' + doc.assigned_to_name;
//     }

//     if (doc.quality_check_assign_to === value && doc.quality_check_assigned_to_name) {
//         return value + ' - ' + doc.quality_check_assigned_to_name;
//     }

//     return value;
// };

// // Override grid rendering for better display
// $(document).on('app_ready', function () {
//     if (frappe.ui.form.GridRow) {
//         const original_render = frappe.ui.form.GridRow.prototype.render_row;

//         frappe.ui.form.GridRow.prototype.render_row = function () {
//             original_render.apply(this, arguments);

//             if (this.doc.doctype === "Quality Check Table") {
//                 if (this.doc.quality_check_assign_to && this.doc.quality_check_assigned_to_name) {
//                     let qc_cell = this.row.find('[data-fieldname="quality_check_assign_to"]');
//                     if (qc_cell.length) {
//                         qc_cell.text(`${this.doc.quality_check_assign_to} - ${this.doc.quality_check_assigned_to_name}`);
//                     }
//                 }

//                 if (this.doc.assigned_to && this.doc.assigned_to_name) {
//                     let assigned_cell = this.row.find('[data-fieldname="assigned_to"]');
//                     if (assigned_cell.length) {
//                         assigned_cell.text(`${this.doc.assigned_to} - ${this.doc.assigned_to_name}`);
//                     }
//                 }
//             }
//         };
//     }
// });