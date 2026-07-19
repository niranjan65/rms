// new code pk >>>>>>>>>>>>>>>>>>>>>


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
//         // doc.repair_status = normalized_status;
//         doc.rma_id_status = normalized_status;
//         return true;
//     }
//     return false;
// }

function safe_add_status_tracking(doc, repair_status) {

    if (!repair_status || !repair_status.trim())
        return false;

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

        // KEEP BOTH FIELDS IN SYNC
        doc.repair_status = normalized_status;
        doc.rma_id_status = normalized_status;

        return true;
    }

    return false;
}

function safe_add_tracking_history(doc, status_type, remarks_text, rma_status_val, qc_pass_val) {
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
            rma_status: rma_status_val,
            quality_check_pass: qc_pass_val || ""
        });
        return true;
    }
    return false;
}

function calculate_tat(start_time, end_time) {
    if (!start_time || !end_time) {
        console.error("calculate_tat: Missing start_time or end_time", { start_time, end_time });
        return null;
    }

    try {
        console.log("calculate_tat called with:", { start_time, end_time });
        let startDate, endDate;

        if (typeof start_time === 'string') {
            startDate = frappe.datetime.str_to_obj(start_time);
        } else {
            startDate = new Date(start_time);
        }

        if (typeof end_time === 'string') {
            endDate = frappe.datetime.str_to_obj(end_time);
        } else {
            endDate = new Date(end_time);
        }

        if (isNaN(startDate.getTime()) || isNaN(endDate.getTime())) {
            console.error("Invalid date objects:", { startDate, endDate });
            return null;
        }

        const diffMs = endDate - startDate;
        if (diffMs < 0) {
            console.error("End time is before start time!");
            return null;
        }

        const totalSeconds = Math.floor(diffMs / 1000);
        const hours = Math.floor(totalSeconds / 3600);
        const minutes = Math.floor((totalSeconds % 3600) / 60);
        const seconds = totalSeconds % 60;

        return `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
    } catch (err) {
        console.error("Error calculating TAT:", err, { start_time, end_time });
        return null;
    }
}

frappe.ui.form.on('Quality Check Technician View', {
    refresh: function (frm) {
        set_current_technician(frm);

        if (frm.doc.__islocal && frm.doc.technician) {
            load_technician_quality_check_data(frm);
        }

        if (frm.custom_buttons["Get Data"]) {
            frm.remove_custom_button("Get Data");
        }

        frm.add_custom_button(__('Get Data'), function () {
            load_technician_quality_check_data(frm, true);
        }).addClass('btn-primary');

        setup_field_filters(frm);
    },

    customer: function (frm) {
        if (frm.doc.lot_no) {
            frm.set_value('lot_no', '');
        }
    },

    rma_id: function (frm) {
        console.log("RMA ID changed to:", frm.doc.rma_id);
    },

    repair_status: function (frm) {
        console.log("Repair Status changed to:", frm.doc.repair_status);
    },

    technician: function (frm) {
        let employee_id = frm.doc.technician;

        if (employee_id && employee_id.includes(' - ')) {
            employee_id = employee_id.split(' - ')[0];
        }

        if (frm.doc.technician && !frm.doc.technician.includes(' - ')) {
            frappe.db.get_value('Employee', employee_id, ['employee', 'employee_name'])
                .then(r => {
                    if (r.message) {
                        const { employee, employee_name } = r.message;
                        frm.set_value('technician', `${employee} - ${employee_name}`);
                    }
                })
                .catch(err => {
                    console.error('Error fetching employee:', err);
                    frappe.msgprint(`Employee ${employee_id} not found`);
                });
        }
    },

    validate: function (frm) {
        let errors = [];
        if (!frm.__islocal) return;
        if (!frm.doc.quality_check_technician_view_table) return;

        for (let row of frm.doc.quality_check_technician_view_table || []) {
            if (row.quality_check_date && row.quality_check_assigned_date) {
                let qc_date = frappe.datetime.str_to_obj(row.quality_check_date);
                let assigned_date = frappe.datetime.str_to_obj(row.quality_check_assigned_date);

                if (qc_date < assigned_date) {
                    frappe.throw({
                        title: __("Invalid Quality Check Date"),
                        message: __(
                            "Quality Check Date cannot be before Assigned Date.<br><br>" +
                            "<b>Assigned Date:</b> {0}<br>" +
                            "<b>Quality Check Date:</b> {1}",
                            [row.quality_check_assigned_date, row.quality_check_date]
                        )
                    });
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
        }

        frm.refresh_field("quality_check_technician_view_table");
    },

    before_save: async function (frm) {
        console.log("before save called");
        let oldData = JSON.parse(localStorage.getItem("quality_check_tech_view_snapshot") || "[]");

        for (let row of frm.doc.quality_check_technician_view_table || []) {
            let original = oldData.find(o => o.rma_id === row.rma_id);
            if (!original) continue;

            function normalize(val) {
                if (val === undefined || val === null) return "";
                return String(val).trim();
            }

            // Auto-transition to "Repaired" if successful QC
            if (row.quality_check_done == 1 && row.quality_check_pass === "Yes") {
                row.status = "Repaired & Ready to Dispatch";
            }
            if (row.quality_check_initiated == 1 && row.quality_check_done == 1 && row.quality_check_pass === "No") {
                row.status = "QC Failed, Returned to Repair";
            }

            let js_initiated = row.quality_check_initiated == 1 ? 1 : 0;
            let js_done = row.quality_check_done == 1 ? 1 : 0;
            let js_pass = (row.quality_check_pass == "Yes" || row.quality_check_pass == "No" || row.quality_check_pass == 1) ? 1 : 0;
            // let js_pass = (row.quality_check_pass == "Yes" || row.quality_check_pass == 1) ? 1 : 0;

            if (js_done && !js_initiated) continue;
            if (js_done && !js_pass) continue;
            if (js_pass && !js_done) continue;

            let statusChanged = normalize(row.status) !== normalize(original.rma_id_status);
            let remarksChanged = normalize(row.repair_remarks) !== "";
            let lastRemark = (original.remarks && original.remarks.length > 0)
                ? original.remarks[original.remarks.length - 1].repair_remarks
                : "";
            if (normalize(row.repair_remarks) === normalize(lastRemark)) {
                remarksChanged = false;
            }

            // This dynamically detects any change (both checking and unchecking)
            let initiatedChanged = (row.quality_check_initiated != original.quality_check_initiated);
            let doneChanged = (row.quality_check_done != original.quality_check_done);
            let passChanged = normalize(row.quality_check_pass) !== normalize(original.quality_check_pass);
            let qcDateChanged = normalize(row.quality_check_date) !== normalize(original.quality_check_done_date);
            let qcStatusChanged = normalize(row.quality_check_status) !== normalize(original.quality_check_status);

            let hasAnyChange = statusChanged || remarksChanged || initiatedChanged || doneChanged || passChanged || qcDateChanged || qcStatusChanged;

            if (hasAnyChange) {
                // Fetch the document exactly once for all changes
                let rmaDoc = await frappe.db.get_doc("RMA BIN", row.rma_id);
                let docChanged = false;

                if (initiatedChanged) {
                    rmaDoc.quality_check_initiated = row.quality_check_initiated ? 1 : 0;
                    docChanged = true;
                }

                if (doneChanged && row.quality_check_initiated == 1) {
                    rmaDoc.quality_check_done = row.quality_check_done ? 1 : 0;
                    docChanged = true;
                }

                if (passChanged && row.quality_check_initiated == 1 && row.quality_check_done == 1) {
                    rmaDoc.quality_check_pass = row.quality_check_pass;
                    docChanged = true;
                }

                if (qcDateChanged) {
                    rmaDoc.quality_check_done_date = row.quality_check_date;
                    docChanged = true;
                }

                // if (!original.quality_check_start_time) {
                //     rmaDoc.quality_check_start_time = frappe.datetime.now_datetime();
                //     docChanged = true;
                // }

                // if (!original.quality_check_end_time && row.quality_check_done == 1) {
                //     rmaDoc.quality_check_end_time = frappe.datetime.now_datetime();
                //     rmaDoc.total_quality_time = calculate_tat(original.quality_check_start_time || rmaDoc.quality_check_start_time, rmaDoc.quality_check_end_time);
                //     docChanged = true;
                // }

                if (row.quality_check_initiated == 1 && !original.quality_check_start_time && !rmaDoc.quality_check_start_time) {
                    rmaDoc.quality_check_start_time = frappe.datetime.now_datetime();
                    docChanged = true;
                }

                // 2. TAT End Time: Triggered when Quality Check is Done AND the Pass/Fail decision is populated
                if (row.quality_check_initiated == 1 && row.quality_check_done == 1 && row.quality_check_pass && !original.quality_check_end_time && !rmaDoc.quality_check_end_time) {
                    rmaDoc.quality_check_end_time = frappe.datetime.now_datetime();
                    rmaDoc.total_quality_time = calculate_tat(
                        original.quality_check_start_time || rmaDoc.quality_check_start_time, 
                        rmaDoc.quality_check_end_time
                    );
                    docChanged = true;
                }

                if (qcStatusChanged) {
                    rmaDoc.quality_check_status = row.status;
                    docChanged = true;
                }

                if (row.quality_check_done == 1 && row.quality_check_pass === "Yes") {
                    rmaDoc.quality_check_status = "Repaired & Ready to Dispatch";
                    docChanged = true;
                }

                // if (row.quality_check_initiated == 1 && row.quality_check_done == 1 && row.quality_check_pass === "No") {
                //     rmaDoc.quality_check_status = "QC Failed, Returned to Repair";
                //     rmaDoc.rma_id_status = "QC Failed, Returned to Repair";

                //     // 1. Reset Repair & Return fields
                //     // rmaDoc.repaired_by = null;
                //     // rmaDoc.repaired_date = null;
                //     // rmaDoc.rma_assigned_date = null;
                //     // rmaDoc.fault_found = null;
                //     // rmaDoc.repair_remarks = null;
                //     // rmaDoc.repair_and_return_start_time = null;
                //     // rmaDoc.repair_and_return_end_time = null;
                //     // rmaDoc.total_repair_time = null;

                //     // // 2. Reset Quality Check fields
                //     // rmaDoc.quality_check_assigned_to = null;
                //     // rmaDoc.quality_check_assigned_date = null;
                //     // rmaDoc.quality_check_done_date = null;
                //     // rmaDoc.quality_check_start_time = null;
                //     // rmaDoc.quality_check_end_time = null;
                //     // rmaDoc.total_quality_time = null;

                //     // // 3. Clear result selections and checkbox states back to 0
                //     // rmaDoc.quality_check_pass = null;
                //     // rmaDoc.quality_check_initiated = 0;
                //     // rmaDoc.quality_check_done = 0;

                //     docChanged = true;
                // }

                if (row.quality_check_initiated == 1 &&
                    row.quality_check_done == 1 &&
                    row.quality_check_pass === "No") {

                    // QC Failed
                    rmaDoc.quality_check_status = "QC Failed, Returned to Repair";

                    // Parent status
                    rmaDoc.repair_status = "QC Failed, Returned to Repair";
                    rmaDoc.rma_id_status = "QC Failed, Returned to Repair";

                    docChanged = true;
                }

                // Deduplicated remarks log
                if (remarksChanged) {
                    let addedRemark = safe_add_remark(rmaDoc, row.repair_remarks);
                    if (addedRemark) docChanged = true;
                }

                // Deduplicated status logging
                if (statusChanged) {
                    let addedStatus = safe_add_status_tracking(rmaDoc, row.status);
                    if (addedStatus) docChanged = true;
                }

                // Deduplicated tracking logs
                if (row.quality_check_done == 1 && row.quality_check_initiated == 1 && row.quality_check_pass) {
                    let addedTrack = safe_add_tracking_history(
                        rmaDoc,
                        "RMA Q/C Done",
                        `Quality Check Finished by ${frappe.session.user}`,
                        row.status,
                        row.quality_check_pass
                    );
                    if (addedTrack) docChanged = true;
                }

                if (docChanged) {
                    rmaDoc.last_updated_on = frappe.datetime.now_datetime();
                    await frappe.call({
                        method: "frappe.client.save",
                        args: { doc: rmaDoc }
                    });
                }
            }
        }

        let clean_snapshot = (frm.doc.quality_check_technician_view_table || []).map(function (row) {
            return {
                rma_id: row.rma_id,
                quality_check_initiated: row.quality_check_initiated || 0,
                quality_check_done: row.quality_check_done || 0,
                quality_check_pass: row.quality_check_pass || '',
                status: row.status || '',
                repair_remarks: row.repair_remarks || '',
                quality_check_date: row.quality_check_date || '',
                quality_check_status: row.quality_check_status || ''
            };
        });
        localStorage.setItem("quality_check_tech_view_snapshot", JSON.stringify(clean_snapshot));
    },

    after_save: function (frm) {
        let snapshot = JSON.parse(localStorage.getItem("quality_check_tech_view_snapshot") || "[]");
        if (!snapshot.length) return;

        function reapply_snapshot() {
            let applied = false;
            for (let row of frm.doc.quality_check_technician_view_table || []) {
                let snap = snapshot.find(s => s.rma_id === row.rma_id);
                if (!snap) continue;

                if (snap.quality_check_initiated != row.quality_check_initiated) {
                    frappe.model.set_value(row.doctype, row.name, 'quality_check_initiated', snap.quality_check_initiated ? 1 : 0);
                    applied = true;
                }
                if (snap.quality_check_done != row.quality_check_done) {
                    frappe.model.set_value(row.doctype, row.name, 'quality_check_done', snap.quality_check_done ? 1 : 0);
                    applied = true;
                }
                if (snap.quality_check_pass !== row.quality_check_pass) {
                    frappe.model.set_value(row.doctype, row.name, 'quality_check_pass', snap.quality_check_pass || '');
                    applied = true;
                }
            }
            if (applied) {
                frm.refresh_field("quality_check_technician_view_table");
            }
        }

        setTimeout(reapply_snapshot, 500);
        setTimeout(reapply_snapshot, 1000);
        setTimeout(reapply_snapshot, 2000);
    },

    onload_post_render: function (frm) {
        if (frm.doc.__islocal) {
            localStorage.removeItem("quality_check_tech_view_snapshot");
            frm.set_value("customer", "");
            frm.set_value("lot_no", "");
            frm.set_value("repair_status", "");
            frm.clear_table("quality_check_technician_view_table");
            frm.refresh_field("quality_check_technician_view_table");
        }
    }
});

function set_current_technician(frm) {
    let current_user = frappe.session.user;

    frappe.call({
        method: "frappe.client.get_list",
        args: {
            doctype: "Employee",
            filters: { 'prefered_email': current_user },
            fields: ['name', 'employee', 'employee_name'],
            limit_page_length: 1
        },
        callback: function (r) {
            if (r.message && r.message.length > 0) {
                let employee_data = r.message[0];
                frm.set_value('technician', `${employee_data.name} - ${employee_data.employee_name}`);
            }
        }
    });
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

function load_technician_quality_check_data(frm, force_reload = false) {
    if (!force_reload && !frm.doc.__islocal && frm.doc.quality_check_technician_view_table && frm.doc.quality_check_technician_view_table.length > 0) {
        return;
    }

    if (!frm.doc.technician) {
        frappe.show_alert({ message: 'Technician field is required', indicator: 'red' });
        return;
    }

    frappe.call({
        method: "rms.rms.doctype.quality_check_technician_view.quality_check_technician_view.get_technician_quality_check_data",
        args: {
            technician: frm.doc.technician,
            customer: frm.doc.customer || '',
            lot_no: frm.doc.lot_no || '',
            warranty_status: frm.doc.warranty_status || '',
            circle: frm.doc.circle || '',
            rma_id: frm.doc.rma_id || '',
            // Exclude non-assigned records and request "QC Technician Assigned" status automatically
            repair_status: frm.doc.repair_status || 'QC Technician Assigned'
        },
        callback: function (r) {
            frm.clear_table("quality_check_technician_view_table");

            if (r.message && r.message.length > 0) {
                r.message.sort((a, b) => {
                    const aDone = a.quality_check_done ? 1 : 0;
                    const bDone = b.quality_check_done ? 1 : 0;
                    return aDone - bDone;
                });

                localStorage.setItem("quality_check_tech_view_snapshot", JSON.stringify(r.message));

                r.message.forEach(function (row) {
                    let child = frm.add_child("quality_check_technician_view_table");

                    child.lot_no = row.lot_no;
                    child.rma_id = row.rma_id || row.name;
                    child.assigned_to = row.repaired_by?.split(" - ")[0];

                    frappe.db.get_value('Employee', child.assigned_to, 'employee_name').then(r => {
                        if (r.message) {
                            child.assigned_to_name = r.message.employee_name;
                            frm.refresh_field("quality_check_technician_view_table");
                        }
                    });

                    child.quality_check_assigned_to = row.quality_check_assigned_to?.split(" - ")[0];
                    child.quality_check_assigned_to_name = row.quality_check_assigned_to?.split(" - ")[1];
                    child.customer = row.customer;
                    child.model_no = row.model_no;
                    child.part_no = row.part_no;
                    child.serial_no = row.serial_no;
                    child.assigned_date = row.assigned_date;
                    child.component_used = row.components_used;

                    if (row.quality_check_assigned_date) {
                        child.quality_check_assigned_date = row.quality_check_assigned_date;
                    }

                    if (row.rma_assigned_date) {
                        child.assigned_date = row.rma_assigned_date;
                    }

                    if (row.quality_check_done_date) {
                        child.quality_check_date = row.quality_check_done_date;
                    }

                    if (row.quality_check_done) {
                        child.quality_check_done = row.quality_check_done;
                    }

                    child.component_used = row.component_used || '';
                    child.material_receipt = row.material_receipt || '';
                    // child.repair_remarks = row.remarks[row.remarks.length - 1]?.repair_remarks || '';
                    child.fault_found = row.receiving_remarks || '';
                    child.status = row.rma_id_status;
                    child.quality_check_pass = row.quality_check_pass;

                    child.quality_check_initiated = row.quality_check_initiated ? 1 : 0;
                    child.quality_check_done = row.quality_check_done ? 1 : 0;
                    child.quality_check_pass = (row.quality_check_initiated && row.quality_check_done) ? (row.quality_check_pass || '') : '';

                    if (!child.start_time) {
                        child.start_time = frappe.datetime.now_datetime();
                    }

                    if (row.receiving_date) {
                        child.receiving_date = row.receiving_date;
                        let today_date = frappe.datetime.get_today();
                        let diff = frappe.datetime.get_diff(today_date, row.receiving_date);
                        child.tat = diff;
                    }
                });

                frm.refresh_field("quality_check_technician_view_table");

                let filter_info = get_filter_info(frm);
                frappe.show_alert({ message: `Loaded ${r.message.length} records${filter_info}`, indicator: 'green' });
            } else {
                frm.clear_table("quality_check_technician_view_table");
                frm.refresh_field("quality_check_technician_view_table");

                let filter_text = get_active_filters(frm);
                frappe.show_alert({ message: `No data found${filter_text}`, indicator: 'orange' });
            }
        }
    });
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

// Child table events
frappe.ui.form.on("Quality Check Technician View Table", {
    refresh: function (frm) {
        setup_field_filters(frm);
    }
});

frappe.form.link_formatters['Employee'] = function (value, doc) {
    if (doc.assigned_to === value && doc.assigned_to_name) {
        return value + ' - ' + doc.assigned_to_name;
    }
    if (doc.quality_check_assigned_to === value && doc.quality_check_assigned_to_name) {
        return value + ' - ' + doc.quality_check_assigned_to_name;
    }
    return value;
};

frappe.ui.form.on("Quality Check Technician View Table", {
    quality_check_done: function (frm, cdt, cdn) {
        let row = locals[cdt][cdn];
        toggle_row_readonly(frm, row);
    },
    form_render: function (frm, cdt, cdn) {
        let row = locals[cdt][cdn];
        toggle_row_readonly(frm, row);
    }
});

function toggle_row_readonly(frm, row) {
    // Read only logic
}

frappe.ui.form.on("Quality Check Technician view Table", {
    view_details: async function (frm, cdt, cdn) {
        let row = locals[cdt][cdn];
        if (!row.rma_id) {
            frappe.msgprint(__("RMA ID not found."));
            return;
        }

        frappe.dom.freeze(__("Loading Details..."));

        try {
            let rmaDoc = await frappe.db.get_doc("RMA BIN", row.rma_id);
            frappe.dom.unfreeze();

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
                            <div style="font-size: 11px; font-weight: 700; color: #2b6cb0; border-bottom: 2px solid #e2e8f0; padding-bottom: 4px; margin-bottom: 8px; text-transform: uppercase; letter-spacing: 0.5px;">Receiving Model</div>
                            <table style="width: 100%; border-collapse: collapse; font-size: 12px; margin-bottom: 15px;">
                                <tbody>
                                    <tr style="border-bottom: 1px solid #f7fafc;">
                                        <td style="width: 45%; color: #718096; font-weight: 500; padding: 4px 6px;">Customer:</td>
                                        <td style="font-weight: 600; color: #2d3748; padding: 4px 6px;">${rmaDoc.customer || 'N/A'}</td>
                                    </tr>
                                    <tr style="border-bottom: 1px solid #f7fafc;">
                                        <td style="color: #718096; font-weight: 500; padding: 4px 6px;">Lot No.:</td>
                                        <td style="padding: 4px 6px;">${rmaDoc.lot_no || 'N/A'}</td>
                                    </tr>
                                    <tr style="border-bottom: 1px solid #f7fafc;">
                                        <td style="color: #718096; font-weight: 500; padding: 4px 6px;">Make / Model:</td>
                                        <td style="padding: 4px 6px;">${rmaDoc.make || 'N/A'} / ${rmaDoc.model_no || 'N/A'}</td>
                                    </tr>
                                    <tr style="border-bottom: 1px solid #f7fafc;">
                                        <td style="color: #718096; font-weight: 500; padding: 4px 6px;">Part No.:</td>
                                        <td style="padding: 4px 6px;">${rmaDoc.part_no || 'N/A'}</td>
                                    </tr>
                                    <tr style="border-bottom: 1px solid #f7fafc;">
                                        <td style="color: #718096; font-weight: 500; padding: 4px 6px;">Serial No.:</td>
                                        <td style="font-weight: 600; color: #2d3748; padding: 4px 6px;">${rmaDoc.serial_no || 'N/A'}</td>
                                    </tr>
                                    <tr style="border-bottom: 1px solid #f7fafc;">
                                        <td style="color: #718096; font-weight: 500; padding: 4px 6px;">Circle:</td>
                                        <td style="padding: 4px 6px;">${rmaDoc.circle || 'N/A'}</td>
                                    </tr>
                                    <tr style="border-bottom: 1px solid #f7fafc;">
                                        <td style="color: #718096; font-weight: 500; padding: 4px 6px;">Receiving Date:</td>
                                        <td style="padding: 4px 6px;">${rmaDoc.receiving_date || 'N/A'}</td>
                                    </tr>
                                    <tr style="border-bottom: 1px solid #f7fafc;">
                                        <td style="color: #718096; font-weight: 500; padding: 4px 6px;">Material Receipt ID:</td>
                                        <td style="font-weight: 600; color: #2b6cb0; padding: 4px 6px;">${rmaDoc.material_receipt || 'N/A'}</td>
                                    </tr>
                                    <tr style="border-bottom: 1px solid #f7fafc;">
                                        <td style="color: #718096; font-weight: 500; padding: 4px 6px;">Material Request ID:</td>
                                        <td style="padding: 4px 6px;">${rmaDoc.material_request || rmaDoc.material_request_transfer || 'N/A'}</td>
                                    </tr>
                                    <tr style="border-bottom: 1px solid #f7fafc;">
                                        <td style="color: #718096; font-weight: 500; padding: 4px 6px;">Material Issue ID:</td>
                                        <td style="font-weight: 600; color: #2b6cb0; padding: 4px 6px;">
                                            ${Array.isArray(rmaDoc.material_issue) && rmaDoc.material_issue.length > 0
                    ? rmaDoc.material_issue.map(item => {
                        return item.stock_entry || item.name || Object.values(item).find(v => typeof v === 'string' && v.startsWith('MAT')) || 'N/A';
                    }).join(', ')
                    : (rmaDoc.material_issue || 'N/A')
                }
                                        </td>
                                    </tr>
                                    <tr style="border-bottom: 1px solid #f7fafc;">
                                        <td style="color: #718096; font-weight: 500; padding: 4px 6px;">Components Used:</td>
                                        <td style="padding: 4px 6px;">${rmaDoc.component_used_init || 'N/A'}</td>
                                    </tr>
                                    <tr style="border-bottom: 1px solid #f7fafc;">
                                        <td style="color: #718096; font-weight: 500; padding: 4px 6px;">Warehouse:</td>
                                        <td style="padding: 4px 6px;">${rmaDoc.warehouse || 'N/A'}</td>
                                    </tr>
                                    <tr>
                                        <td colspan="2" style="padding: 5px 6px 4px 6px;">
                                            <div style="font-weight: 500; color: #718096; margin-bottom: 2px;">Receiving Remarks:</div>
                                            <!-- Reduced height & line height layout for quick inputs -->
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
                            <div style="font-size: 11px; font-weight: 700; color: #2b6cb0; border-bottom: 2px solid #e2e8f0; padding-bottom: 4px; margin-bottom: 8px; text-transform: uppercase; letter-spacing: 0.5px;">Repair Model</div>
                            <table style="width: 100%; border-collapse: collapse; font-size: 12px; margin-bottom: 15px;">
                                <tbody>
                                    <tr style="border-bottom: 1px solid #f7fafc;">
                                        <td style="width: 45%; color: #718096; font-weight: 500; padding: 4px 6px;">Assign To:</td>
                                        <td style="padding: 4px 6px;">${rmaDoc.assigned_to || rmaDoc.repaired_by || 'N/A'}</td>
                                    </tr>
                                    <tr style="border-bottom: 1px solid #f7fafc;">
                                        <td style="color: #718096; font-weight: 500; padding: 4px 6px;">RMA Assigned Date:</td>
                                        <td style="padding: 4px 6px;">${rmaDoc.rma_assigned_date || 'N/A'}</td>
                                    </tr>
                                    <tr style="border-bottom: 1px solid #f7fafc;">
                                        <td style="color: #718096; font-weight: 500; padding: 4px 6px;">Status Update Date:</td>
                                        <td style="padding: 4px 6px;">${rmaDoc.repaired_date || 'N/A'}</td>
                                    </tr>
                                    <tr style="border-bottom: 1px solid #f7fafc;">
                                        <td style="color: #718096; font-weight: 500; padding: 4px 6px;">Fault Found:</td>
                                        <td style="font-weight: 600; color: #e53e3e; padding: 4px 6px;">${rmaDoc.fault_found || 'N/A'}</td>
                                    </tr>
                                    <tr style="border-bottom: 1px solid #f7fafc;">
                                        <td style="color: #718096; font-weight: 500; padding: 4px 6px;">Total TAT:</td>
                                        <td style="font-weight: 600; color: #e53e3e; padding: 4px 6px;">${rmaDoc.total_quality_time || 'N/A'}</td>
                                    </tr>
                                    <tr>
                                        <!-- Center aligned Repair Remarks block -->
                                        <td colspan="2" style="padding: 10px 6px 4px 6px; text-align: center;">
                                            <div style="font-weight: 500; color: #718096; margin-bottom: 4px; text-align: center;">Repair Remarks:</div>
                                            <div style="background: #f7fafc; border: 1px solid #edf2f7; border-radius: 4px; padding: 6px 8px; font-size: 11px; color: #4a5568; max-height: 80px; overflow-y: auto; white-space: pre-wrap; text-align: center; margin: 0 auto; display: block;">
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
    },

    view_remarks: async function (frm, cdt, cdn) {
        let row = locals[cdt][cdn];

        console.log("clicked", row.rma_id);
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
    }
});