// Copyright (c) 2025, Anantdv and contributors
// For license information, please see license.txt

frappe.ui.form.on("Batch No", {
    // refresh(frm) {
    //     frm.set_df_property("bulk_name", "read_only", 1);
    // },

    // is_bulk: function(frm) {
    //     if (frm.doc.is_bulk) {
    //         frappe.call({
    //             method: "frappe.client.get_list",
    //             args: {
    //                 doctype: "Batch No",
    //                 filters: {
    //                     bulk_name: ["like", "BULK%"]
    //                 },
    //                 fields: ["bulk_name"],
    //                 order_by: "bulk_name desc",
    //                 limit: 1
    //             },
    //             callback: function(response) {
    //                 let next_number = 1;
                    
    //                 if (response.message && response.message.length > 0) {
    //                     const last_bulk = response.message[0].bulk_name;
    //                     const last_number = parseInt(last_bulk.replace("BULK", ""));
    //                     next_number = last_number + 1;
    //                 }
                    
    //                 const new_bulk_name = "BULK" + String(next_number).padStart(4, '0');
    //                 frm.set_value("bulk_name", new_bulk_name);
    //             }
    //         });
    //     } else {
    //         frm.set_value("bulk_name", "");
    //     }
    // }

    setup: function(frm) {
        const total_rmas = frm.doc.rma_no ? frm.doc.rma_no.length : 0;
        console.log("Total RMAs", total_rmas);
        frm.set_value('total_quantity', total_rmas);
    }
});

