// new code pk >>>>>>>>>>>>

frappe.ui.form.on("RMA", {

  onload: function (frm) {
    frm.set_query("warehouse", () => {
      return {
        filters: {
          company: "Ductus Technologies Pvt. Ltd.",
        },
      };
    });
  },



  validate: function (frm) {

    // STEP 1: Check if at least one row has an RMA ID
    const hasRmaId = frm.doc.rma_features?.some(row => row.rma_id);

    if (!hasRmaId) {
      frappe.throw("Generate RMA ID's before proceeding");
    }

    // STEP 2: Find all rows without RMA ID and collect their row numbers
    let rowsWithoutRmaId = [];

    if (frm.doc.rma_features && frm.doc.rma_features.length > 0) {
      frm.doc.rma_features.forEach((row, index) => {
        if (!row.rma_id || row.rma_id.trim() === "") {
          rowsWithoutRmaId.push({
            rowNumber: index + 1,  // Human-readable row number (1-based)
            model: row.model || 'No Model',
            partNo: row.part_no || 'No Part No'
          });
        }
      });
    }

    // STEP 3: If any rows are missing RMA ID, throw error with details
    if (rowsWithoutRmaId.length > 0) {
      // Build detailed error message
      let errorMessage = `<b>${rowsWithoutRmaId.length} row(s) are missing RMA ID:</b><br><br>`;

      rowsWithoutRmaId.forEach(row => {
        errorMessage += `<b>Row ${row.rowNumber}:</b> Model: ${row.model}, Part No: ${row.partNo}<br>`;
      });

      errorMessage += `<br><b>Please generate RMA IDs for all rows before saving.</b>`;

      // Throw error with formatted message
      frappe.throw({
        title: __('Missing RMA IDs'),
        message: __(errorMessage),
        indicator: 'red'
      });
    }
  },

  customer: function (frm) {

    generateAndSetCustomerPrefix(frm);

    // Clear old RMA in all child rows
    (frm.doc.rma_features || []).forEach(row => {
      row.old_rma_id = "";
    });

    frm.refresh_field("rma_features");

  },


  rma_features_add: function (frm) {
    calculate_total(frm);
  },

  rma_features_remove: function (frm) {
    calculate_total(frm);
  },


  generate_unique_id: async function (frm) {

    /* ===============================
     * EXISTING PERFECT CODE (UNCHANGED)
     * =============================== */

    if (!frm.doc.rma_features || frm.doc.rma_features.length === 0) {
      frappe.throw(__("Please add at least one part in RMA Features"));
      return;
    }

    if (!frm.doc.customer || frm.doc.customer.length < 2) {
      frappe.throw(__("Customer name must be at least 2 characters long"));
      return;
    }

    let rowsWithModel = frm.doc.rma_features.filter(r => r.model);
    if (rowsWithModel.length === 0) {
      frappe.throw(__("Please add Model in at least one row before generating RMA IDs"));
      return;
    }

    /* ===============================
     * DUPLICATE IN RMA BIN
     * (serial_no + brand + model)
     * =============================== */

    const rows = frm.doc.rma_features || [];
    let serial_map = {};
    let error_rows = [];

    // Build composite key from CHILD TABLE
    rows.forEach(row => {
      if (!row.serial_no || !row.brand || !row.model) return;

      let key = `${row.serial_no}||${row.brand}||${row.model}`;

      if (!serial_map[key]) {
        serial_map[key] = [];
      }

      serial_map[key].push({
        idx: row.idx,
        serial_no: row.serial_no,
        brand: row.brand,
        model: row.model
      });
    });

    if (Object.keys(serial_map).length) {

      // Fetch from RMA BIN
      let bins = await frappe.db.get_list('RMA BIN', {
        filters: {
          serial_no: ['in', rows.map(r => r.serial_no).filter(Boolean)],
          rma_id_status: ['not in', ['Dispatched', 'Delivered']]
        },
        fields: [
          'serial_no',
          'make',
          'model_no',
          'rma_id_status',
          'lot_no'
        ]
      });

      // Compare using correct field mapping
      bins.forEach(bin => {
        let key = `${bin.serial_no}||${bin.make}||${bin.model_no}`;

        if (serial_map[key]) {
          serial_map[key].forEach(r => {
            error_rows.push({
              row: r.idx,
              serial_no: bin.serial_no,
              brand: bin.make,
              model: bin.model_no,
              status: bin.rma_id_status,
              lot_no: bin.lot_no
            });
          });
        }
      });

      // Remove duplicates
      let seen = {};
      error_rows = error_rows.filter(r => {
        let k = `${r.row}-${r.serial_no}-${r.brand}-${r.model}`;
        if (seen[k]) return false;
        seen[k] = true;
        return true;
      });

      if (error_rows.length) {
        let msg = error_rows
          .map(r =>
            `Row <b>${r.row}</b> → Serial No <b>${r.serial_no}</b> ` +
            `(Brand: <b>${r.brand}</b>, Model: <b>${r.model}</b>, ` +
            `Lot No: <b>${r.lot_no || '-'}</b>, Status: ${r.status})`
          )
          .join('<br>');

        frappe.throw(__(
          `Serial Numbers already exists :<br><br>${msg}`
        ));
      }
    }

    /* ===============================
     * FINAL ACTION (UNCHANGED)
     * =============================== */

    generateRMANumbers(frm);
  },


  refresh: function (frm) {
    console.log("RMA form refreshed", frm.doc);

    // Show date information if document is draft
    if (frm.doc.docstatus === 0 && !frm.doc.date) {
      // frm.set_intro("Date will be set automatically when the document is submitted", "blue");
    }

    frm.set_query("model", "rma_features", function () {
      return {
        filters: {
          "item_group": "Products",
          "disabled": 0
        }
      };
    });

    frm.set_query(
    "old_rma_id",
    "rma_features",
    function(doc){

        return{

            filters:{

                customer:doc.customer,

                rma_id_status:"Delivered"

            }

        };

    }
);

    frm.set_query("part_no", "rma_features", function (doc, cdt, cdn) {
      // let child = locals[cdt][cdn];
      return {
        filters: {
          item_group: "Components",
          disabled: 0

          // model_no: child.model || ""
        }
      };
    });

    frm.set_query("repair_status", "rma_features", function () {
      return {
        filters: {
          name: "Hold"
        }
      };
    });
  }
});

function generateAndSetCustomerPrefix(frm) {
  if (!frm.doc.customer) {
    console.log("No customer selected");
    return;
  }

  const words = frm.doc.customer.split(" ");

  if (words.length < 2) {
    console.log("Customer name needs at least two words");
    return;
  }

  let initialPrefix = (words[0][0] + words[1][0]).toUpperCase();
  let alternatePrefix = (words[0][1] + words[1][0]).toUpperCase();

  frappe.call({
    method: "frappe.client.get_list",
    args: {
      doctype: "RMA",
      filters: {
        customer_prefix: initialPrefix,
        customer: ["!=", frm.doc.customer],
      },
      fields: ["name"],
    },
    callback: function (r) {
      let prefix = initialPrefix;

      if (r.message && r.message.length > 0) {
        prefix = alternatePrefix;
      }

      frm.set_value("customer_prefix", prefix);
    },
  });
}

function calculate_total(frm) {
  // Quantity is now based on the number of rows in rma_features
  let total_qty = 0;

  if (frm.doc.rma_features && frm.doc.rma_features.length) {
    total_qty = frm.doc.rma_features.length;
  }

  frm.set_value("quantity", total_qty);
  frm.refresh_field("quantity");
  console.log("Total quantity calculated based on rows:", total_qty);
}

function generateRMANumbers(frm) {
  const prefix = frm.doc.customer_prefix;

  if (!prefix) {
    frappe.throw(__("Customer prefix not generated. Please check the customer name."));
    return;
  }

  let generatedCount = 0;
  let skippedCount = 0;
  let alreadyExistCount = 0;
  let serialCounter = 1;

  // Generate RMA ID only for rows that have a model value AND don't already have an RMA ID
  frm.doc.rma_features.forEach((feature, index) => {
    // Check if this row has a model value
    if (feature.model) {
      // Check if RMA ID already exists
      if (feature.rma_id && feature.rma_id.trim() !== "") {
        // RMA ID already exists, skip generation
        alreadyExistCount++;
        console.log(`Row ${index + 1}: RMA ID already exists (${feature.rma_id})`);
      } else {
        // Generate new RMA ID
        const serialNum = String(serialCounter).padStart(3, "0");
        const randomPart = generateRandomChars(3);
        const rmaNumber = `${prefix}${randomPart}${serialNum}`;

        // Set the RMA ID in the rma_id field
        feature.rma_id = rmaNumber;
        generatedCount++;
        console.log(`Row ${index + 1}: Generated new RMA ID (${rmaNumber})`);
      }
      serialCounter++;
    } else {
      // Clear any existing RMA ID for rows without model
      feature.rma_id = "";
      skippedCount++;
      console.log(`Row ${index + 1}: Skipped RMA ID generation (no model selected)`);
    }
  });

  frm.refresh_field("rma_features");

  // Show summary message
  let message = "";
  if (generatedCount > 0) {
    message += `Generated ${generatedCount} new RMA IDs successfully!`;
  }
  if (alreadyExistCount > 0) {
    if (message) message += " ";
    message += `${alreadyExistCount} RMA IDs already existed.`;
  }
  if (skippedCount > 0) {
    if (message) message += " ";
    message += `Skipped ${skippedCount} rows without model.`;
  }

  if (generatedCount === 0 && alreadyExistCount > 0) {
    message = "All rows with models already have RMA IDs generated.";
  }

  frappe.show_alert({
    message: message,
    indicator: generatedCount > 0 ? 'green' : 'orange'
  });

  if (generatedCount > 0) {
    frm.dirty();
    frm.save();
  }
}

function generateRandomChars(length) {
  const characters = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
  let result = "";
  for (let i = 0; i < length; i++) {
    result += characters.charAt(Math.floor(Math.random() * characters.length));
  }
  return result;
}

frappe.ui.form.on('RMA Features', {
  model: function (frm, cdt, cdn) {
    let child = locals[cdt][cdn];
    if (child.model) {
      frappe.db.get_value('Item', child.model, 'brand')
        .then(r => {
          if (r.message && r.message.make) {
            frappe.model.set_value(cdt, cdn, 'brand', r.message.make);
          }
        });
    }
  },

  old_rma_id:function(frm,cdt,cdn){

        let row=locals[cdt][cdn];

        if(!row.old_rma_id)
            return;

        frappe.call({

            method:"rms.rms.doctype.rma.rma.get_old_rma_details",

            args:{

                customer:frm.doc.customer,

                old_rma:row.old_rma_id

            },

            freeze:true,

            freeze_message:"Fetching Old RMA...",

            callback: function(r) {

    if (!r.message)
        return;

    let d = r.message;

    frappe.model.set_value(cdt, cdn, "brand", d.make);

    frappe.model.set_value(cdt, cdn, "model", d.model);

    frappe.model.set_value(cdt, cdn, "part_no", d.part_no);

    frappe.model.set_value(cdt, cdn, "warranty_status", d.warranty_status);

    frappe.msgprint({
        title: "Warranty Information",
        indicator: d.warranty_status === "Yes" ? "green" : "red",
        message: d.message
    });

}

        });

    }

});


frappe.ui.form.on("RMA Features", {
  download: function (frm, cdt, cdn) {
    const row = locals[cdt][cdn];

    if (!row.barcode) {
      frappe.msgprint("Please Create RMA id & Submit It");
      return;
    }

    const url =
      "/api/method/rms.rms.doctype.rma.rma.download_barcode"
      + "?barcode_value=" + encodeURIComponent(row.barcode);

    window.open(url);
  }
});




frappe.ui.form.on('RMA', {
  refresh(frm) {

    // Remove default Download menu
    setTimeout(() => {
      frm.page.remove_menu_item(__('Download'));
    }, 300);

    // Add Print Barcodes button after submit
    if (frm.doc.docstatus === 1) {

      const exists = frm.page.inner_toolbar
        .find('.btn:contains("Print Barcodes")').length;

      if (!exists) {
        frm.add_custom_button(
          __('Print Barcodes'),
          () => {
            print_all_rma_barcodes(frm);
          }
        ).addClass('btn-primary');
      }
    }
  }
});

function print_all_rma_barcodes(frm) {

  const rma_ids = frm.doc.rma_features
    .filter(r => r.rma_id)
    .map(r => r.rma_id);

  if (!rma_ids.length) {
    frappe.msgprint("No RMA IDs found");
    return;
  }

  frappe.call({
    method: "rms.rms.doctype.rma.rma.generate_rma_barcodes",
    args: {
      rma_ids: JSON.stringify(rma_ids)
    },
    callback(r) {
      if (!r.message) return;

      const win = window.open("", "_blank");

      let html = "<html><body>";

      r.message.forEach(url => {
        html += `
                    <div style="page-break-after:always;">
                        <img src="${url}" />
                    </div>
                `;
      });

      html += `
                <script>
                    window.onload = function(){ window.print(); }
                </script>
            </body></html>`;

      win.document.write(html);
      win.document.close();
    }
  });
}


frappe.ui.form.on("RMA Features", {
  download: function (frm, cdt, cdn) {
    const row = locals[cdt][cdn];

    if (!row.barcode) {
      frappe.msgprint("Please Create RMA id & Submit It");
      return;
    }

    const url =
      "/api/method/rms.rms.doctype.rma.rma.download_barcode"
      + "?barcode_value=" + encodeURIComponent(row.barcode);

    window.open(url);
  }
});


frappe.ui.form.on('RMA', {
  refresh(frm) {

    // Remove default Download menu
    setTimeout(() => {
      frm.page.remove_menu_item(__('Download'));
    }, 300);

    // Add Print Barcodes button after submit
    if (frm.doc.docstatus === 1) {

      const exists = frm.page.inner_toolbar
        .find('.btn:contains("Print Barcodes")').length;

      if (!exists) {
        frm.add_custom_button(
          __('Print Barcodes'),
          () => {
            print_all_rma_barcodes(frm);
          }
        ).addClass('btn-primary');
      }
    }
  }
});

function print_all_rma_barcodes(frm) {

  const rma_ids = frm.doc.rma_features
    .filter(r => r.rma_id)
    .map(r => r.rma_id);

  if (!rma_ids.length) {
    frappe.msgprint("No RMA IDs found");
    return;
  }

  frappe.call({
    method: "rms.rms.doctype.rma.rma.generate_rma_barcodes",
    args: {
      rma_ids: JSON.stringify(rma_ids)
    },
    callback(r) {
      if (!r.message) return;

      const win = window.open("", "_blank");

      let html = "<html><body>";

      r.message.forEach(url => {
        html += `
                    <div style="page-break-after:always;">
                        <img src="${url}" />
                    </div>
                `;
      });

      html += `
                <script>
                    window.onload = function(){ window.print(); }
                </script>
            </body></html>`;

      win.document.write(html);
      win.document.close();
    }
  });
}
