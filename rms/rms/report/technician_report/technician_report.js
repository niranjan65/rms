// frappe.query_reports["Technician Report"] = {
//     filters: [
//         {
//             fieldname: "repair_status",
//             label: "Repair Status",
//             fieldtype: "Select",
//             options: "\nUnder Repair\nRepaired\nScrap"
//         },
//         {
//             fieldname: "repaired_by",
//             label: "Assign to",
//             fieldtype: "Data",
//             read_only: 1
//         },
//         {
//             fieldname: "customer",
//             label: "Customer",
//             fieldtype: "Link",
//             options: "Customer",
//             change: function () {
//                 frappe.query_report.set_filter_value("lot_no", "");
//                 frappe.query_report.set_filter_value("rma_id", "");
//             }
//         },
//         {
//             fieldname: "lot_no",
//             label: "Lot No.",
//             fieldtype: "Link",
//             options: "RMA",
//             get_query: function () {
//                 let customer = frappe.query_report.get_filter_value("customer");
//                 let repaired_by = frappe.query_report.get_filter_value("repaired_by");

//                 // Build filters for RMA based on RMA BIN repaired_by
//                 let filters = {};
//                 if (customer) filters["customer"] = customer;

//                 // If repaired_by is set, restrict lot_no to only those in RMA BIN
//                 if (repaired_by) {
//                     return {
//                         filters: filters,
//                         query: "frappe.client.get_list",
//                         doctype: "RMA",
//                         filter_by: {
//                             name: ["in",
//                                 frappe.db.get_list("RMA BIN", {
//                                     filters: { repaired_by: repaired_by },
//                                     fields: ["lot_no"],
//                                     pluck: "lot_no"
//                                 })
//                             ]
//                         }
//                     };
//                 }

//                 return { filters: filters };
//             },
//             change: function () {
//                 frappe.query_report.set_filter_value("rma_id", "");
//             }
//         },
//         // {
//         //     fieldname: "lot_no",
//         //     label: "Lot No.",
//         //     fieldtype: "Link",
//         //     options: "RMA",
//         //     get_query: function () {
//         //         let customer = frappe.query_report.get_filter_value("customer");
//         //         return {
//         //             filters: customer ? { customer: customer } : {}
//         //         };
//         //     },
//         //     change: function () {
//         //         frappe.query_report.set_filter_value("rma_id", "");
//         //     }
//         // },
//         {
//             fieldname: "rma_id",
//             label: "RMA ID",
//             fieldtype: "Link",
//             options: "RMA BIN",
//             get_query: function () {
//                 let lot_no = frappe.query_report.get_filter_value("lot_no");
//                 let customer = frappe.query_report.get_filter_value("customer");
//                 let repaired_by = frappe.query_report.get_filter_value("repaired_by");

//                 let filters = {};
//                 if (lot_no) filters["lot_no"] = lot_no;
//                 if (customer) filters["customer"] = customer;
//                 // Always restrict to current technician
//                 if (repaired_by) filters["repaired_by"] = repaired_by;

//                 return { filters: filters };
//             }
//         }
//     ],

//     onload: function (report) {
//         setTimeout(function () {
//             frappe.db.get_list("Employee", {
//                 fields: ["name", "employee_name"],
//                 filters: { "user_id": frappe.session.user },
//                 limit: 1
//             }).then(function (data) {
//                 if (!data || !data.length) {
//                     console.warn("No Employee record found for:", frappe.session.user);
//                     return;
//                 }

//                 let emp = data[0];
//                 let repaired_by_value = emp.name + " - " + emp.employee_name;

//                 frappe.query_report.set_filter_value("repaired_by", repaired_by_value);
//                 frappe.query_report.refresh();
//             });
//         }, 500);
//     }
// };





// function load_lot_numbers() {

//     let customer = frappe.query_report.get_filter_value("customer");
//     let repair_status = frappe.query_report.get_filter_value("repair_status");

//     let filters = {};

//     if (customer) {
//         filters.customer = customer;
//     }

//     if (repair_status) {
//         filters.repair_status = repair_status;
//     }

//     frappe.db.get_list("RMA BIN", {
//         fields: ["lot_no"],
//         filters: filters,
//         limit: 500
//     }).then(function(data) {

//         let options = [""];

//         data.forEach(function(d) {
//             if (d.lot_no && !options.includes(d.lot_no)) {
//                 options.push(d.lot_no);
//             }
//         });

//         let lot_filter = frappe.query_report.get_filter("lot_no");
//         lot_filter.df.options = options.join("\n");
//         lot_filter.refresh();
//     });
// }

// frappe.query_reports["Technician Report"] = {

//     filters: [

//         {
//             fieldname: "repair_status",
//             label: "Repair Status",
//             fieldtype: "Select",
//             options: "\nUnder Repair\nRepaired\nScrap",
//             change: function() {

//                 frappe.query_report.set_filter_value("lot_no", "");
//                 frappe.query_report.set_filter_value("rma_id", "");

//                 load_lot_numbers();
//             }
//         },

//         {
//             fieldname: "repaired_by",
//             label: "Assign To",
//             fieldtype: "Data",
//             read_only: 1
//         },

//         {
//             fieldname: "customer",
//             label: "Customer",
//             fieldtype: "Link",
//             options: "Customer",
//             change: function() {

//                 frappe.query_report.set_filter_value("lot_no", "");
//                 frappe.query_report.set_filter_value("rma_id", "");

//                 load_lot_numbers();
//             }
//         },

//         {
//             fieldname: "lot_no",
//             label: "Lot No.",
//             fieldtype: "Select",
//             options: "",
//             change: function() {
//                 frappe.query_report.set_filter_value("rma_id", "");
//             }
//         },

//         {
//             fieldname: "rma_id",
//             label: "RMA ID",
//             fieldtype: "Link",
//             options: "RMA BIN",

//             get_query: function() {

//                 let filters = {};

//                 let customer = frappe.query_report.get_filter_value("customer");
//                 let repair_status = frappe.query_report.get_filter_value("repair_status");
//                 let lot_no = frappe.query_report.get_filter_value("lot_no");

//                 if (customer) {
//                     filters.customer = customer;
//                 }

//                 if (repair_status) {
//                     filters.repair_status = repair_status;
//                 }

//                 if (lot_no) {
//                     filters.lot_no = lot_no;
//                 }

//                 return {
//                     filters: filters
//                 };
//             }
//         }
//     ],

//     onload: function() {

//         load_lot_numbers();

//         frappe.db.get_list("Employee", {
//             fields: ["name", "employee_name"],
//             filters: {
//                 user_id: frappe.session.user
//             },
//             limit: 1
//         }).then(function(data) {

//             if (!data || !data.length) {
//                 return;
//             }

//             let emp = data[0];

//             frappe.query_report.set_filter_value(
//                 "repaired_by",
//                 emp.name + " - " + emp.employee_name
//             );
//         });
//     }
// };

function load_lot_numbers() {

    let customer = frappe.query_report.get_filter_value("customer");
    let repair_status = frappe.query_report.get_filter_value("repair_status");
    let repaired_by = frappe.query_report.get_filter_value("repaired_by");

    let filters = {};

    if (customer) {
        filters.customer = customer;
    }

    if (repair_status) {
        filters.repair_status = repair_status;
    }

    // --- FIX: Pass the entire string because database matches the full "ID - Name" format ---
    if (repaired_by) {
        filters.repaired_by = repaired_by; 
    }

    frappe.db.get_list("RMA BIN", {
        fields: ["lot_no"],
        filters: filters,
        limit: 500
    }).then(function(data) {

        let options = [""];

        data.forEach(function(d) {
            if (d.lot_no && !options.includes(d.lot_no)) {
                options.push(d.lot_no);
            }
        });

        let lot_filter = frappe.query_report.get_filter("lot_no");
        if (lot_filter) {
            lot_filter.df.options = options.join("\n");
            lot_filter.refresh();
        }
    });
}

frappe.query_reports["Technician Report"] = {

    filters: [
        {
            fieldname: "repair_status",
            label: "Repair Status",
            fieldtype: "Select",
            options: "\nUnder Repair\nRepaired\nScrap",
            change: function() {
                frappe.query_report.set_filter_value("lot_no", "");
                frappe.query_report.set_filter_value("rma_id", "");
                load_lot_numbers();
            }
        },

        {
            fieldname: "repaired_by",
            label: "Assign To",
            fieldtype: "Data",
            read_only: 1,
            change: function() {
                frappe.query_report.set_filter_value("lot_no", "");
                frappe.query_report.set_filter_value("rma_id", "");
                load_lot_numbers();
            }
        },

        {
            fieldname: "customer",
            label: "Customer",
            fieldtype: "Link",
            options: "Customer",
            change: function() {
                frappe.query_report.set_filter_value("lot_no", "");
                frappe.query_report.set_filter_value("rma_id", "");
                load_lot_numbers();
            }
        },

        {
            fieldname: "lot_no",
            label: "Lot No.",
            fieldtype: "Select",
            options: "",
            change: function() {
                frappe.query_report.set_filter_value("rma_id", "");
            }
        },

        {
            fieldname: "rma_id",
            label: "RMA ID",
            fieldtype: "Link",
            options: "RMA BIN",
            get_query: function() {
                let filters = {};
                let customer = frappe.query_report.get_filter_value("customer");
                let repair_status = frappe.query_report.get_filter_value("repair_status");
                let lot_no = frappe.query_report.get_filter_value("lot_no");
                let repaired_by = frappe.query_report.get_filter_value("repaired_by");

                if (customer) {
                    filters.customer = customer;
                }

                if (repair_status) {
                    filters.repair_status = repair_status;
                }

                if (lot_no) {
                    filters.lot_no = lot_no;
                }

                // --- FIX: Pass the entire string here too ---
                if (repaired_by) {
                    filters.repaired_by = repaired_by;
                }

                return {
                    filters: filters
                };
            }
        }
    ],

    onload: function() {
        frappe.db.get_list("Employee", {
            fields: ["name", "employee_name"],
            filters: {
                user_id: frappe.session.user
            },
            limit: 1
        }).then(function(data) {

            if (!data || !data.length) {
                return;
            }

            let emp = data[0];

            frappe.query_report.set_filter_value(
                "repaired_by",
                emp.name + " - " + emp.employee_name
            );

            load_lot_numbers();
        });
    }
};