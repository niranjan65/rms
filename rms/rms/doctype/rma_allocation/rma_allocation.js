// // Copyright (c) 2025, Anantdv and contributors
// // For license information, please see license.txt

frappe.ui.form.on("RMA Allocation", {
  // refresh: function (frm) {
  //         if (!frm.is_new()) {
  //             frm.add_custom_button('Toggle Unassigned Rows', function () {
  //                 let showWithTechnician = frm.show_with_technician || false;

  //                 // Select which list to show
  //                 let rowsToShow = showWithTechnician
  //                     ? frm.doc.rma_without_technician
  //                     : frm.doc.rma_with_technician;

  //                 frm.clear_table('rma_allocated_list');
  //                 (rowsToShow || []).forEach(row => {
  //                     frm.add_child('rma_allocated_list', row);
  //                 });

  //                 frm.show_with_technician = !showWithTechnician;
  //                 frm.refresh_field('rma_allocated_list');
  //             });
  //         }
  //     },

  refresh(frm) {
    if (!frm.is_new()) {
      frm.add_custom_button("Toggle Unassigned Rows", function () {
        frm.show_with_technician = !frm.show_with_technician;
        console.log("Show with technician:", frm.show_with_technician);

        let show_with = frm.show_with_technician;

        frm.fields_dict.rma_allocated_list.grid.grid_rows.forEach((row) => {
          let hasTechnician = !!row.doc.technician;
          row.wrapper.toggle(show_with ? hasTechnician : !hasTechnician);
        });
      });
    }
  },

  isbulk: function (frm) {
    if (frm.doc.isbulk) {
      frm.set_df_property("rma_allocated_list", "hidden", 1);
    } else {
      frm.set_df_property("rma_allocated_list", "hidden", 0);
    }
  },
  customer: function (frm) {
    frm.clear_table("rma_allocated_list");
    frm.set_value("total_acquired_quantity", 0);
    frm.set_value("unallocated_quantity", 0);
    frm.set_value("allocated_quantity", 0);
    frm.refresh_fields([
      "total_acquired_quantity",
      "unallocated_quantity",
      "allocated_quantity",
    ]);
    frm.set_value("isbulk", 0);

    frm.set_query("batch_no", () => {
      return {
        filters: {
          custom_customer: frm.doc.customer,
          custom_rma_allocation_check: 0,
        },
      };
    });
  },
  batch_no: function (frm) {
    frm.clear_table("rma_allocated_list");
    frm.set_value("total_acquired_quantity", 0);
    frm.set_value("unallocated_quantity", 0);
    frm.set_value("allocated_quantity", 0);

    frm.refresh_fields([
      "total_acquired_quantity",
      "unallocated_quantity",
      "allocated_quantity",
    ]);
    frm.set_value("isbulk", 0);

    if (frm.doc.batch_no) {
      frm.clear_table("rma_allocated_list");
      if (!frm.doc.isbulk) {
        // frappe.call({
        //   method: "frappe.client.get",
        //   args: {
        //     doctype: "Physical Screening",
        //     filters: [
        //       // ['batch_no', 'like', '%a%'],
        //       ["batch_no", "=", frm.doc.batch_no],
        //     ],
        //     fields: ["*"],
        //   },
        //   callback: function (r) {
        //     if (r.message) {
        //       console.log("helloofirst", r.message);
        //       if (r.message.is_bulk == 0) {
        //         frm.set_df_property("isbulk", "hidden", 1);
        //       }
        //       let data = r.message;
        //       frm.doc.item = data.item;
        //       frm.refresh_field("item");
        //       console.log("item", frm.doc.item);
        //       console.log("first", data);
        //       if (data.is_bulk == 0) {
        //         data.screening_items.forEach((item) => {
        //           // console.log("second", item);
        //           if (item.status === "Ok") {
        //             // console.log("third", item);
        //             let row = frm.add_child("rma_allocated_list");
        //             console.log("fourth", row);
        //             row.rma_item = item.item;
        //             row.serial_number = item.serial_number;
        //             frm.refresh_field("rma_allocated_list");
        //           }
        //         });
        //       } else if (data.is_bulk == 1) {
        //         console.log("isbulk", data.is_bulk);

        //         frm.set_value("isbulk", 1);
        //         frm.set_value(
        //           "total_acquired_quantity",
        //           data.bulk_items[0].accepted_quantity ||
        //             data.bulk_items[0].quantity
        //         );
        //         frm.set_value(
        //           "unallocated_quantity",
        //           data.bulk_items[0].accepted_quantity ||
        //             data.bulk_items[0].quantity
        //         );
        //         frm.refresh_fields([
        //           "total_acquired_quantity",
        //           "unallocated_quantity",
        //         ]);
        //       }
        //     }
        //   },
        // });

        frappe.call({
          method: "frappe.client.get",
          args: {
            doctype: "Batch",
            name: frm.doc.batch_no,
            fields: ["*"],
            limit_page_length: 1,
          },
          callback: function (r) {
            if (r.message) {
              console.log("helloofirst", r.message);
              if (r.message.custom_is_bulk == 0) {
                frm.set_df_property("isbulk", "hidden", 1);
              }
              let data = r.message;
              frm.doc.item = data.item;
              frm.refresh_field("item");
              console.log("item", frm.doc.item);
              console.log("first", data);

              if (data.custom_is_bulk == 0) {
                data.custom_rma_no.forEach((item) => {
                  // console.log("second", item);
                  if (item.material_receipt_done == 1 && Number(item.physical_screening_done) == 1 && item.rma_allocation_done == 0) {
                    console.log("third", item);
                    let row = frm.add_child("rma_allocated_list");
                    console.log("fourth", row);
                    row.rma_item = item.rma_no;
                    row.serial_number = item.serial_no;
                    frm.refresh_field("rma_allocated_list");
                  }
                });
              // } else if (data.custom_is_bulk == 1) {
              //   console.log("isbulk", data);

              //   frm.set_value("isbulk", 1);
              //   frm.set_value(
              //     "total_acquired_quantity",
              //     data.bulk_items[0].accepted_quantity ||
              //       data.bulk_items[0].quantity
              //   );
              //   frm.set_value(
              //     "unallocated_quantity",
              //     data.bulk_items[0].accepted_quantity ||
              //       data.bulk_items[0].quantity
              //   );
              //   frm.refresh_fields([
              //     "total_acquired_quantity",
              //     "unallocated_quantity",
              //   ]);
              }

              frappe.call({
                method: "frappe.client.get",
                args: {
                  doctype: "Physical Screening",
                  filters: [
                    // ['batch_no', 'like', '%a%'],
                    ["batch_no", "=", frm.doc.batch_no],
                  ],
                  fields: ["*"],
                },
                callback: function (r) {
                  if (r.message) {
                    console.log("helloofirst", r.message);
                    if (r.message.is_bulk == 0) {
                      frm.set_df_property("isbulk", "hidden", 1);
                    }
                    let data = r.message;
                    frm.doc.item = data.item;
                    frm.refresh_field("item");
                    console.log("item", frm.doc.item);
                    console.log("first", data);
                    if (data.is_bulk == 1) {
                      console.log("isbulk", data.is_bulk);

                      frm.set_value("isbulk", 1);
                      frm.set_value(
                        "total_acquired_quantity",
                        data.bulk_items[0].accepted_quantity ||
                          data.bulk_items[0].quantity
                      );
                      frm.set_value(
                        "unallocated_quantity",
                        data.bulk_items[0].accepted_quantity ||
                          data.bulk_items[0].quantity
                      );
                      frm.refresh_fields([
                        "total_acquired_quantity",
                        "unallocated_quantity",
                      ]);
                    }
                  }
                },
              });
            }
          },
        });
      }
    }
  },

  before_save: function (frm) {
    if (frm.doc.batch_no) {
      console.log("Batch No RMA ALlocation:", frm.doc.batch_no);
      if (frm.doc.isbulk) {
        frappe.call({
          method: "frappe.client.set_value",
          args: {
            doctype: "Batch",
            name: frm.doc.batch_no,
            fieldname: "custom_rma_allocation_check",
            value: 1,
          },
          callback: function (r) {
            if (!r.exc) {
              console.log("Batch updated successfully");
            }
          },
        });
      }
    }
  },
});

frappe.ui.form.on("Bulk RMA Allocation List", {
  quantity: function (frm, cdt, cdn) {
    let row = locals[cdt][cdn];
    if (row.quantity > frm.doc.unallocated_quantity) {
      frappe.msgprint(__("Quantity cannot be greater than available quantity"));
    } else if (row.quantity < 0) {
      frappe.msgprint(__("Quantity cannot be negative"));
    } else {
      console.log("Row quantity updated:", row.quantity);

      frm.doc.unallocated_quantity -= row.quantity;
      frm.doc.allocated_quantity += row.quantity;

      frm.refresh_field("unallocated_quantity");
      frm.refresh_field("allocated_quantity");

      console.log(
        "Unallocated quantity before update:",
        frm.doc.unallocated_quantity
      );
      console.log(
        "Allocated quantity before update:",
        frm.doc.allocated_quantity
      );
    }
    frm.refresh_field("unallocated_quantity");
    frm.refresh_field("rma_allocated_list");
  },
});
