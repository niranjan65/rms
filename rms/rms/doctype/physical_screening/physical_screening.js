frappe.ui.form.on("Physical Screening", {
  setup: function (frm) {
    console.log("works..........");
    // if (!frm.doc.__islocal) {
    //   frm.enable_form();
    //   frm.enable_save();
    // }
  },
  // refresh: function (frm) {
  //   if (
  //     (!frm.is_new() &&
  //       frm.doc.screening_items &&
  //       frm.doc.screening_items.length > 0) ||
  //     (!frm.is_new() && frm.doc.bulk_items && frm.doc.bulk_items.length > 0)
  //   ) {
  //     frm.add_custom_button(__("Go to Allocation List"), function () {
  //       generateRMAAllocation(frm);
  //     });
  //   }
  // },

  onload: function (frm) {
    console.log("Onload called");
    frm.set_df_property("screening_items", "cannot_add_rows", true);
    frm.set_df_property("bulk_items", "cannot_add_rows", true);

    // if (frm.doc.__unsaved) {
    //   frm.enable_save();
    // }
  },

  batch_no: function (frm) {
    frm.clear_table("screening_items");
    frm.clear_table("bulk_items");
    frm.set_value("is_bulk", 0);
    frm.refresh_fields(["bulk_items", "screening_items"]);

    console.log("Batch No", frm.doc.batch_no);

    if (frm.doc.batch_no) {
      frappe.call({
        method: "frappe.client.get",
        args: {
          doctype: "Batch",
          name: frm.doc.batch_no,
        },
        callback: function (r) {
          console.log("Batch Data", r);

          if (r.custom_is_bulk == 0) {
            console.log("Not a bulk item");
            frm.set_df_property("is_bulk", "hidden", 1);
            frm.refresh_field("is_bulk");
          }
          frm.doc.item = r.message.item;
          frm.doc.is_bulk = r.message.custom_is_bulk;
          frm.refresh_field("is_bulk");
          frm.clear_table("bulk_items");
          // frm.clear_table('screening_items');
          frm.refresh_fields(["bulk_items", "screening_items"]);

          if (frm.doc.batch_no) {
            fetchBatchData(frm);
            fetchScreeningItems(frm);
          }
        },
      });
    }
  },

  // fetch_rma_list: function(frm) {
  //     if(!frm.doc.batch_no) {
  //         frappe.throw("Please select a batch number first");
  //         return;
  //     }
  //     fetchBatchData(frm);
  // },

  is_bulk: function (frm) {
    frm.clear_table("bulk_items");
    // frm.clear_table('screening_items');
    frm.refresh_fields(["bulk_items", "screening_items"]);

    if (frm.doc.batch_no) {
      fetchBatchData(frm);
    }
  },

  // refresh: function (frm) {
  //   console.log("Refresh called");
  //   if (!frm.doc.__islocal) {
  //     frm.disable_save();
  //     // frm.save_disabled = true;
  //     // frm.disable_form();
  //   } else {
  //     frm.enable_save();
  //   }
  // },

  fetch_rma_list: function (frm) {
    if (!frm.doc.batch_no) {
      frappe.throw("Please select a batch number first");
      return;
    }
    fetchScreeningItems(frm);
  },

  customer: function (frm) {
    frm.clear_table("screening_items");
    frm.clear_table("bulk_items");
    frm.set_value("is_bulk", 0);
    frm.refresh_fields(["bulk_items", "screening_items"]);

    frm.set_value("batch_no", "");
    frm.set_query("batch_no", () => {
      return {
        filters: {
          custom_customer: frm.doc.customer,
        },
      };
    });
  },
  before_save: function (frm) {
    if (frm.doc.batch_no) {
      if (frm.doc.is_bulk) {
        frappe.call({
          method: "frappe.client.set_value",
          args: {
            doctype: "Batch",
            name: frm.doc.batch_no,
            fieldname: "custom_physical_screening_check",
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

function generateRMAAllocation(frm) {
  let ps_children = [];
  let accepted_qty = 0;
  if (frm.doc.bulk_items && frm.doc.bulk_items.length > 0) {
    accepted_qty = frm.doc?.bulk_items[0]?.accepted_quantity;
  }

  frm.doc.screening_items.forEach((item) => {
    if (item.status === "Ok") {
      ps_children.push(item);
    }
  });

  let allocation_list = frappe.model.get_new_doc("RMA Allocation");
  allocation_list.rma_allocated_list = [];

  allocation_list.customer = frm.doc.customer;
  allocation_list.batch_no = frm.doc.batch_no;
  allocation_list.item = frm.doc.item;

  if (frm.doc.screening_items && frm.doc.screening_items.length > 0) {
    ps_children.forEach((item) => {
      allocation_list.rma_allocated_list.push({
        doctype: "RMA Assignment",
        rma_item: item.item,
        serial_number: item.serial_number,
      });
    });
  }

  if (frm.doc.bulk_items && frm.doc.bulk_items.length > 0) {
    allocation_list.isbulk = 1;
    allocation_list.total_acquired_quantity = accepted_qty;
    allocation_list.unallocated_quantity = accepted_qty;
  }

  console.log("Allocation List Data", allocation_list);

  frappe.db
    .insert(allocation_list)
    .then(() => {
      frappe.set_route("Form", "RMA Allocation", allocation_list.name);
    })
    .catch((err) => {
      console.error(`Error creating RMA Allocation`, err);
      frappe.throw(`Error creating RMA Allocation: ${err}`);
    });
}

function fetchBatchData(frm) {
  frappe.call({
    method: "frappe.client.get",
    args: {
      doctype: "Batch",
      name: frm.doc.batch_no,
    },
    callback: function (r) {
      if (!r.message) {
        frappe.show_alert({
          message: __("No data found for this batch"),
          indicator: "red",
        });
        return;
      }

      if (frm.doc.is_bulk) {
        // Handle bulk items
        frm.clear_table("bulk_items");

        // Check if RMA No child table exists and has items
        if (r.message.custom_rma_no && r.message.custom_rma_no.length > 0) {
          let row = frm.add_child("bulk_items");
          row.bulk_name = frm.doc.batch_no;

          // Set quantity equal to number of RMA items
          row.quantity = r.message.custom_rma_no.length;

          frm.refresh_field("bulk_items");

          frappe.show_alert({
            message: __("Bulk quantity fetched successfully"),
            indicator: "green",
          });
        } else {
          frappe.show_alert({
            message: __("No quantity data found for bulk processing"),
            indicator: "red",
          });
        }
      }
    },
  });
}

// function fetchScreeningItems(frm) {
//   frappe.call({
//     method: "frappe.client.get",
//     args: {
//       doctype: "Batch",
//       name: frm.doc.batch_no,
//     },
//     callback: function (r) {
//       console.log("Batch Data", r);
//       if (!r.message) {
//         frappe.show_alert({
//           message: __("No data found for this batch"),
//           indicator: "red",
//         });
//         return;
//       }

//       if (r.message.custom_rma_no && r.message.custom_rma_no.length > 0) {
//         frm.clear_table("screening_items");

//         r.message.custom_rma_no.forEach((rma_item) => {
//           let row = frm.add_child("screening_items");
//           row.item = rma_item.rma_no;
//           row.serial_number = rma_item.serial_no;
//           // row.status = 'Pending';
//         });

//         frm.refresh_field("screening_items");

//         frappe.show_alert({
//           message: __("RMA List fetched successfully"),
//           indicator: "green",
//         });
//       } else {
//         frappe.show_alert({
//           message: __("No RMA items found for this batch"),
//           indicator: "red",
//         });
//       }
//     },
//   });
// }

function fetchScreeningItems(frm) {
  frappe.call({
    method: "frappe.client.get",
    args: {
      doctype: "Batch",
      name: frm.doc.batch_no,
    },
    callback: function (r) {
      console.log("Batch Data", r);
      if (!r.message) {
        frappe.show_alert({
          message: __("No data found for this batch"),
          indicator: "red",
        });
        return;
      }

      if (r.message.custom_rma_no && r.message.custom_rma_no.length > 0) {
        // Filter the custom_rma_no array
        let filtered_rma_list = r.message.custom_rma_no.filter((rma_item) => {
          return (
            rma_item.material_receipt_done === 1 &&
            Number(rma_item.physical_screening_done) === 0
          );
        });

        console.log("Filtered Cutie", filtered_rma_list);

        if (filtered_rma_list.length > 0) {
          frm.clear_table("screening_items");
          filtered_rma_list.forEach((rma_item) => {
            let row = frm.add_child("screening_items");
            console.log("Hellooooooooooooooooooooo Cutieeee");
            row.item = rma_item.rma_no;
            row.serial_number = rma_item.serial_no;
            // row.status = 'Pending';
          });

          frm.refresh_field("screening_items");

          frappe.show_alert({
            message: __("RMA List fetched successfully"),
            indicator: "green",
          });
        } else {
          frappe.show_alert({
            message: __(
              "Please complete the material receipt for rest of the items ."
            ),
            indicator: "red",
          });
        }
      } else {
        frappe.show_alert({
          message: __("No RMA items found for this batch"),
          indicator: "red",
        });
      }
    },
  });
}

frappe.ui.form.on("BULK Items", {
  accepted_quantity: function (frm, cdt, cdn) {
    let row = locals[cdt][cdn];
    row.rejected_quantity = row.quantity - row.accepted_quantity;
    if (row.rejected_quantity < 0) {
      row.accepted_quantity = 0;
      row.rejected_quantity = 0;
      frm.refresh_field("bulk_items");
      frappe.throw("Accepted quantity cannot be greater than total quantity");
    }
    if (row.rejected_quantity > row.quantity) {
      row.rejected_quantity = 0;
      frm.refresh_field("bulk_items");
      frappe.throw("Rejected quantity cannot be greater than total quantity");
    }
    frm.refresh_field("bulk_items");
  },
});
frappe.ui.form.on("Physical Screening", {
  before_save: function (frm) {
    frm.doc.screening_items.forEach(function (child) {
      console.log("Child Item", child);
      child.item1 = frm.doc.item;
      console.log("Updated Child Item", child.item1);
    });
    frm.refresh_field("screening_items");
  },
});
