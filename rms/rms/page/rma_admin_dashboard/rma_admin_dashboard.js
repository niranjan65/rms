frappe.pages['rma-admin-dashboard'].on_page_load = function(wrapper) {
    let allowed_roles = ['System Manager', 'Administrator', 'RMA Creation'];
    let has_access = allowed_roles.some(r => frappe.user.has_role(r));

    if (!has_access) {
        frappe.msgprint({ title: __('Access Denied'), indicator: 'red', message: __('You need the <b>RMA Creation</b> role to view the RMA Command Center.') });
        $(wrapper).html(`
            <div style="display: flex; justify-content: center; align-items: center; height: 80vh; flex-direction: column;">
                <i class="fa fa-lock" style="font-size: 60px; color: #dc2626; margin-bottom: 20px;"></i>
                <h2 style="color: #0f172a; font-weight: 700;">Access Denied</h2>
                <p style="color: #64748b;">You do not have the required permissions to view this dashboard.</p>
            </div>
        `);
        return; 
    }

    var page = frappe.ui.make_app_page({ parent: wrapper, title: '', single_column: true });
    let logo_url = '/files/Ductus-logo120265.png';

    // --- 1. FILTERS ---
    let customer_filter = page.add_field({ fieldname: 'customer', label: __('Customer'), fieldtype: 'Link', options: 'Customer', change: load_data });
    let circle_filter = page.add_field({ fieldname: 'circle', label: __('Circle'), fieldtype: 'Link', options: 'Location', change: load_data });
    let lot_filter = page.add_field({ fieldname: 'lot_no', label: __('Lot No'), fieldtype: 'Link', options: 'RMA', change: load_data });
    
    page.add_inner_button('Expand All', expand_all).addClass('btn-default');
    page.add_inner_button('Collapse All', collapse_all).addClass('btn-default');
    page.add_inner_button('Refresh Data', load_data).addClass('btn-primary');

    // --- 2. HTML STRUCTURE ---
    $(wrapper).find('.layout-main-section').html(`
        <div class="ductus-dashboard">
            <div class="ductus-header">
                <img src="${logo_url}" alt="Ductus" class="ductus-logo">
                <div class="header-text" style="flex-grow: 1;">
                    <h2>RMA Command Center</h2>
                    <p>Advanced Hierarchical Tracking & Analytics</p>
                </div>
                <div class="search-box">
                    <input type="text" id="live-search" class="form-control" placeholder="🔍 Search RMAs, Components, Lots..." style="width: 300px; border-radius: 20px;">
                </div>
            </div>

            <div class="ductus-tabs-container">
                <button class="ductus-tab-btn active" data-target="#tab-tracking">Hierarchical Tracking</button>
                <button class="ductus-tab-btn" data-target="#tab-components">Lot Component Usage</button>
            </div>

            <div id="tab-tracking" class="ductus-tab-content active" style="display: block;">
                <div class="ductus-card">
                    <div class="table-responsive">
                        <table class="table ductus-tree-table" id="tree-table">
                            <thead><tr><th>Customer / Lot / RMA Tracking</th></tr></thead>
                            <tbody><tr><td class="text-center text-muted">Loading data...</td></tr></tbody>
                        </table>
                    </div>
                </div>
            </div>

            <div id="tab-components" class="ductus-tab-content" style="display: none;">
                <div class="ductus-card">
                    <div class="table-responsive">
                        <table class="table table-hover" id="component-table">
                            <thead style="background: #f4f5f8;">
                                <tr>
                                    <th>Customer / Lot Number</th>
                                    <th>Total RMAs</th>
                                    <th>Consolidated Components (Tally)</th>
                                </tr>
                            </thead>
                            <tbody></tbody>
                        </table>
                    </div>
                </div>
            </div>

            <div class="tracking-backdrop" id="tracking-backdrop"></div>
            <div class="tracking-sidebar" id="tracking-sidebar">
                <div class="sidebar-header">
                    <h4 id="sidebar-title">Information</h4>
                    <button class="btn btn-sm btn-danger close-sidebar">✕ Close</button>
                </div>
                <div class="sidebar-content" id="sidebar-content-area"></div>
            </div>
        </div>
    `);

    // --- 3. PROFESSIONAL CSS ---
    $("<style>").prop("type", "text/css").html(`
        .ductus-dashboard { padding: 10px; background-color: #f4f5f8; min-height: 100vh; position: relative; overflow-x: hidden; }
        .ductus-header { display: flex; align-items: center; background: #fff; padding: 20px; border-radius: 8px; box-shadow: 0 2px 10px rgba(0,0,0,0.03); margin-bottom: 20px; border-left: 5px solid #0056b3; }
        .ductus-logo { max-height: 55px; margin-right: 20px; }
        .ductus-header h2 { margin: 0; font-weight: 700; color: #2c3e50; font-size: 22px; }
        .ductus-card { background: #fff; padding: 20px; border-radius: 8px; box-shadow: 0 2px 10px rgba(0,0,0,0.05); }
        
        .ductus-tabs-container { margin-bottom: 15px; display: flex; gap: 10px; border-bottom: 2px solid #e2e8f0; padding-bottom: 10px; }
        .ductus-tab-btn { background: transparent; border: none; font-size: 15px; font-weight: 600; color: #64748b; padding: 10px 20px; border-radius: 6px; cursor: pointer; transition: all 0.2s; }
        .ductus-tab-btn.active { background: #0056b3; color: white; }

        .chevron { transition: transform 0.2s ease-in-out; display: inline-block; }
        .rotate-90 { transform: rotate(90deg); }
        
        .row-customer { background-color: #e2e8f0; font-weight: 700; cursor: pointer; font-size: 15px; border-radius: 4px; }
        .row-lot { background-color: #f8fafc; font-weight: 600; cursor: pointer; font-size: 14px; border-left: 4px solid #94a3b8; }
        .row-rma-header { cursor: pointer; font-size: 14px; background: white; border-bottom: 1px solid #e2e8f0; transition: background 0.2s;}
        .row-rma-header:hover { background: #f1f5f9; }
        
        .rma-detail-container { background: #f8fafc; padding: 20px; border-radius: 0 0 8px 8px; border: 1px solid #e2e8f0; border-top: none; }
        .rma-detail-col { border-right: 1px solid #e2e8f0; padding: 0 15px; }
        .rma-detail-col:last-child { border-right: none; }
        .rma-detail-col h6 { font-weight: 700; color: #475569; margin-bottom: 15px; font-size: 13px; text-transform: uppercase; border-bottom: 1px solid #e2e8f0; padding-bottom: 5px;}
        
        .receiving-summary { background-color: #e2e8f0; border-radius: 6px; padding: 12px 15px; margin-bottom: 20px; font-size: 12px; color: #334155; }
        .receiving-summary b { color: #0f172a; text-transform: uppercase; font-size: 11px; letter-spacing: 0.5px; display: block; margin-bottom: 2px;}

        .info-row { display: flex; font-size: 13px; color: #334155; margin-bottom: 8px; line-height: 1.4; align-items: flex-start;}
        .info-label { font-weight: 600; color: #0f172a; width: 85px; flex-shrink: 0; }
        .info-val { flex-grow: 1; word-break: break-word;}
        
        .badge-status { padding: 5px 12px; border-radius: 12px; font-size: 12px; font-weight: 600; }
        .bg-del { background: #dcfce7; color: #166534; }
        .bg-prog { background: #fef08a; color: #854d0e; }
        
        .tracking-sidebar { position: fixed; top: 0; right: -450px; width: 450px; height: 100vh; background: #fff; box-shadow: -5px 0 25px rgba(0,0,0,0.15); transition: right 0.3s ease; z-index: 1050; display: flex; flex-direction: column; }
        .tracking-sidebar.open { right: 0; }
        .tracking-backdrop { position: fixed; top: 0; left: 0; width: 100vw; height: 100vh; background: rgba(0,0,0,0.4); z-index: 1040; display: none; backdrop-filter: blur(2px); }
        .sidebar-header { padding: 20px; border-bottom: 1px solid #e2e8f0; display: flex; justify-content: space-between; align-items: center; background: #f8fafc; }
        .sidebar-header h4 { margin: 0; font-weight: 700; color: #0f172a; }
        .sidebar-content { padding: 20px; overflow-y: auto; flex-grow: 1; }
        
        .ductus-timeline { border-left: 2px solid #cbd5e1; margin-left: 10px; padding-left: 20px; }
        .timeline-item { position: relative; margin-bottom: 25px; }
        .timeline-item::before { content: ''; position: absolute; left: -27px; top: 4px; width: 12px; height: 12px; border-radius: 50%; background: #0056b3; border: 2px solid #fff; box-shadow: 0 0 0 2px #0056b3; }
        .sidebar-card { background: #f8fafc; border: 1px solid #e2e8f0; padding: 15px; border-radius: 6px; margin-bottom: 10px;}
    `).appendTo("head");

    // --- 4. INTERACTIVE LOGIC ---
    $(wrapper).on('click', '.ductus-tab-btn', function() {
        $('.ductus-tab-btn').removeClass('active');
        $(this).addClass('active');
        $('.ductus-tab-content').hide();
        $($(this).data('target')).fadeIn(200);
    });

    function expand_all() { $('.row-lot, .row-rma-header, [id^="detail-"], [class^="comp-child-of-"]').show(); $('.chevron').addClass('rotate-90'); }
    function collapse_all() { $('.row-lot, .row-rma-header, [id^="detail-"], [class^="comp-child-of-"]').hide(); $('.chevron').removeClass('rotate-90'); }

    // SIDEBAR LOGIC
    $(wrapper).on('click', '.open-sidebar', function() {
        let type = $(this).data('type');
        let title = $(this).data('title');
        let data = JSON.parse(decodeURIComponent($(this).data('content')));
        
        $('#sidebar-title').text(title);
        let html = '';

        if (type === 'tracking') {
            if (data.length === 0) html = '<p class="text-muted">No tracking history found.</p>';
            html += '<div class="ductus-timeline">';
            data.forEach(track => {
                html += `<div class="timeline-item">
                    <div style="font-weight:700; color:#1e293b; font-size:14px;">${track.status}</div>
                    <div style="font-size:11px; color:#64748b; margin-bottom:6px;">🕒 ${track.time}</div>
                    ${track.remarks ? `<div style="font-size:13px; color:#475569; background:#f1f5f9; padding:8px; border-radius:4px; margin-bottom:4px;">${track.remarks}</div>` : ''}
                    <div style="font-size:11px; color:#0f172a; font-weight:600;">👤 ${track.user}</div>
                </div>`;
            });
            html += '</div>';
        } else if (type === 'inventory') {
            if (data.length === 0) html = '<p class="text-muted">No records found.</p>';
            data.forEach(d => {
                let items_table = '';
                if(d.items && d.items.length > 0) {
                    items_table = `<table class="table table-sm mt-3 mb-0" style="font-size: 12px; background: #fff; border: 1px solid #e2e8f0;">
                        <thead class="thead-light"><tr><th>Item Code</th><th width="50px">Qty</th></tr></thead><tbody>`;
                    d.items.forEach(it => { items_table += `<tr><td>${it.item_code}</td><td>${it.qty}</td></tr>`; });
                    items_table += `</tbody></table>`;
                } else {
                    items_table = '<p class="text-muted small mt-2 mb-0">No items found in this entry.</p>';
                }

                html += `<div class="sidebar-card">
                    <a href="/app/stock-entry/${d.id}" style="font-weight:bold; font-size: 15px;">${d.id}</a>
                    <div class="text-muted" style="font-size:12px; margin-top:5px;">👤 Approved/Owned by: <span class="text-primary">${d.owner}</span></div>
                    ${items_table}
                </div>`;
            });
        }

        $('#sidebar-content-area').html(html);
        $('#tracking-sidebar').addClass('open');
        $('#tracking-backdrop').fadeIn(200);
    });

    $(wrapper).on('click', '.close-sidebar, #tracking-backdrop', function() {
        $('#tracking-sidebar').removeClass('open');
        $('#tracking-backdrop').fadeOut(200);
    });

    $(wrapper).off('click', '.row-customer').on('click', '.row-customer', function() {
        let cust = $(this).data('cust');
        let $lots = $('.lot-of-' + cust);
        let $chevron = $(this).find('.chevron');
        if ($lots.is(':visible')) { $lots.hide(); $('.child-of-cust-' + cust).hide(); $chevron.removeClass('rotate-90'); } 
        else { $lots.fadeIn(200); $chevron.addClass('rotate-90'); }
    });

    $(wrapper).off('click', '.row-lot').on('click', '.row-lot', function() {
        let lot = $(this).data('lot');
        let $rmas = $('.rma-of-' + lot);
        let $chevron = $(this).find('.chevron');
        if ($rmas.is(':visible')) { $rmas.hide(); $('.detail-of-' + lot).hide(); $chevron.removeClass('rotate-90'); } 
        else { $rmas.fadeIn(200); $chevron.addClass('rotate-90'); }
    });

    $(wrapper).off('click', '.row-rma-header').on('click', '.row-rma-header', function() {
        let rma = $(this).data('rma');
        let $detail = $('#detail-' + rma);
        let $chevron = $(this).find('.chevron');
        if ($detail.is(':visible')) { $detail.hide(); $chevron.removeClass('rotate-90'); } 
        else { $detail.fadeIn(200); $chevron.addClass('rotate-90'); }
    });

    $('#live-search').on('keyup', function() {
        let value = $(this).val().toLowerCase();
        $("#tree-table tbody tr").filter(function() { $(this).toggle($(this).text().toLowerCase().indexOf(value) > -1) });
    });

    // --- 5. SEAMLESS STATE PRESERVATION ---
    window.dashboard_ui_state = { customers: [], lots: [], rmas: [] };

    function save_ui_state() {
        window.dashboard_ui_state = { customers: [], lots: [], rmas: [] };
        $('.row-customer .chevron.rotate-90').each(function() { window.dashboard_ui_state.customers.push($(this).closest('tr').data('cust')); });
        $('.row-lot .chevron.rotate-90').each(function() { window.dashboard_ui_state.lots.push($(this).closest('tr').data('lot')); });
        $('.row-rma-header .chevron.rotate-90').each(function() { window.dashboard_ui_state.rmas.push($(this).closest('tr').data('rma')); });
    }

    function restore_ui_state() {
        window.dashboard_ui_state.customers.forEach(id => {
            $(`.row-customer[data-cust="${id}"]`).find('.chevron').addClass('rotate-90');
            $(`.lot-of-${id}`).show();
        });
        window.dashboard_ui_state.lots.forEach(id => {
            $(`.row-lot[data-lot="${id}"]`).find('.chevron').addClass('rotate-90');
            $(`.rma-of-${id}`).show();
        });
        window.dashboard_ui_state.rmas.forEach(id => {
            $(`.row-rma-header[data-rma="${id}"]`).find('.chevron').addClass('rotate-90');
            $(`#detail-${id}`).show();
        });
    }

    function load_data() {
        save_ui_state();
        frappe.call({
            method: 'rms.rms.page.rma_admin_dashboard.rma_admin_dashboard.get_hierarchical_dashboard_data',
            args: { filters: JSON.stringify({ customer: customer_filter.get_value(), circle: circle_filter.get_value(), lot_no: lot_filter.get_value() }) },
            callback: function(r) {
                render_hierarchical_view(r.message || []);
                render_component_view(r.message || []);
                restore_ui_state();
            }
        });
    }

    // --- 6. RENDER HIERARCHY ---
    function render_hierarchical_view(data) {
        let tbody = $('#tree-table tbody').empty();
        if (data.length === 0) return tbody.append('<tr><td class="text-center">No data found.</td></tr>');

        let grouped = {};
        
        data.forEach(rma => {
            let cust = rma.customer || 'Unknown Customer'; 
            let lot = rma.lot_no || 'Unassigned Lot';
            if (!grouped[cust]) grouped[cust] = {};
            if (!grouped[cust][lot]) {
                grouped[cust][lot] = { 
                    date: rma.receiving_date, 
                    material_receipt: rma.material_receipt || '--',
                    rmas: [] 
                };
            }
            grouped[cust][lot].rmas.push(rma);
        });

        for (let cust in grouped) {
            let cust_id = cust.replace(/[^a-zA-Z0-9]/g, "");
            tbody.append(`<tr class="row-customer" data-cust="${cust_id}">
                <td><i class="fa fa-chevron-right chevron mr-2 text-primary" style="font-size: 12px;"></i><i class="fa fa-building text-primary mr-2"></i> <strong>${cust}</strong></td>
            </tr>`);

            for (let lot in grouped[cust]) {
                let lot_id = lot.replace(/[^a-zA-Z0-9]/g, ""); 
                let lot_info = grouped[cust][lot];
                
                let receipt_html = lot_info.material_receipt !== '--' 
                    ? `<a href="/app/stock-entry/${lot_info.material_receipt}" style="font-weight:600;">${lot_info.material_receipt}</a>` 
                    : '--';

                tbody.append(`<tr class="row-lot lot-of-${cust_id}" data-lot="${lot_id}" style="display:none;">
                    <td style="padding-left: 30px;">
                        <i class="fa fa-chevron-right chevron mr-2 text-secondary" style="font-size: 12px;"></i>
                        <i class="fa fa-box text-secondary mr-2"></i> Lot: <strong>${lot}</strong> 
                        <span class="text-muted ml-3" style="font-size: 12px;">📅 Received: ${lot_info.date}</span>
                        <span class="text-muted ml-3" style="font-size: 12px;">🧾 Mat. Receipt: ${receipt_html}</span>
                        <span class="badge badge-info float-right">${lot_info.rmas.length} Items</span>
                    </td>
                </tr>`);

                lot_info.rmas.forEach(rma => {
                    let rma_clean = rma.rma_id.replace(/[^a-zA-Z0-9]/g, "");
                    
                    let rep_name = rma.repaired_by_name ? ` - ${rma.repaired_by_name}` : '';
                    let rep_link = rma.repaired_by ? `<a href="/app/employee/${rma.repaired_by}">${rma.repaired_by}</a>${rep_name}` : '--';

                    let qc_name = rma.qc_by_name ? ` - ${rma.qc_by_name}` : '';
                    let qc_link = rma.quality_check_assigned_to ? `<a href="/app/employee/${rma.quality_check_assigned_to}">${rma.quality_check_assigned_to}</a>${qc_name}` : '--';
                    
                    let dn_link = rma.delivery_note_id ? `<a href="/app/delivery-note/${rma.delivery_note_id}">${rma.delivery_note_id}</a>` : '--';

                    tbody.append(`<tr class="row-rma-header rma-of-${lot_id} child-of-cust-${cust_id}" data-rma="${rma_clean}" style="display:none;">
                        <td style="padding-left: 60px;">
                            <i class="fa fa-chevron-right chevron mr-2 text-muted" style="font-size: 12px;"></i>
                            <span class="mr-2">📄 <strong>${rma.rma_id}</strong></span>
                            <span class="badge-status ${rma.repair_status === 'Delivered' ? 'bg-del' : 'bg-prog'} mr-2">${rma.rma_id_status || 'Pending Status'}</span>
                        </td>
                    </tr>`);

                    // --> INJECTED THE RECEIVING SUMMARY BAR HERE <--
                    tbody.append(`<tr id="detail-${rma_clean}" class="detail-of-${lot_id} child-of-cust-${cust_id}" style="display:none;">
                        <td style="padding: 0 0 0 85px; border-top: none;">
                            <div class="rma-detail-container">
                                
                                <div class="receiving-summary">
                                    <div class="row m-0">
                                        <div class="col-sm-2"><b>Make</b> ${rma.make || '--'}</div>
                                        <div class="col-sm-3"><b>Model No</b> <a href="/app/item/${rma.model_no}">${rma.model_no || '--'}</a></div>
                                        <div class="col-sm-2"><b>Part No</b> ${rma.part_no || '--'}</div>
                                        <div class="col-sm-2"><b>Serial No</b> ${rma.serial_no || '--'}</div>
                                        <div class="col-sm-3"><b>Remarks</b> ${rma.receiving_remarks || '--'}</div>
                                    </div>
                                </div>
                                
                                <div class="row m-0">
                                    <div class="col-lg-3 col-md-6 rma-detail-col">
                                        <h6>🛠️ Repair Info</h6>
                                        <div class="info-row"><div class="info-label">Tech:</div><div class="info-val">${rep_link}</div></div>
                                        <div class="info-row"><div class="info-label">Status:</div><div class="info-val">${rma.repair_status || '--'}</div></div>
                                        <div class="info-row"><div class="info-label">Time Spent:</div><div class="info-val">${rma.total_repair_time}</div></div>
                                    </div>
                                    <div class="col-lg-3 col-md-6 rma-detail-col">
                                        <h6>🔍 Quality Check</h6>
                                        <div class="info-row"><div class="info-label">QC Tech:</div><div class="info-val">${qc_link}</div></div>
                                        <div class="info-row"><div class="info-label">QC Pass:</div><div class="info-val ${rma.quality_check_pass === 'Yes' ? 'text-success' : (rma.quality_check_pass === 'No' ? 'text-danger' : '')}"><b>${rma.quality_check_pass || '--'}</b></div></div>
                                        <div class="info-row"><div class="info-label">QC Date:</div><div class="info-val">${rma.quality_check_done_date || '--'}</div></div>
                                        <div class="info-row"><div class="info-label">Time Spent:</div><div class="info-val">${rma.total_quality_time}</div></div>
                                    </div>
                                    <div class="col-lg-3 col-md-6 rma-detail-col">
                                        <h6>📦 Inventory Track</h6>
                                        <button class="btn btn-xs btn-outline-primary btn-block mt-2 open-sidebar" data-type="inventory" data-title="${rma.rma_id} - Stock Outs" data-content="${encodeURIComponent(JSON.stringify(rma.stock_outs))}">📤 View Stock Outs (${rma.stock_outs.length})</button>
                                        <button class="btn btn-xs btn-outline-info btn-block mt-2 open-sidebar" data-type="inventory" data-title="${rma.rma_id} - Material Requests" data-content="${encodeURIComponent(JSON.stringify(rma.material_requests))}">📋 View Requests (${rma.material_requests.length})</button>
                                    </div>
                                    <div class="col-lg-3 col-md-6 rma-detail-col" style="border-right: none;">
                                        <h6>🚚 Delivery Details</h6>
                                        <div class="info-row"><div class="info-label">Del. Note:</div><div class="info-val">${dn_link}</div></div>
                                        <div class="info-row"><div class="info-label">Challan:</div><div class="info-val">${rma.delivery_challan_no || '--'}</div></div>
                                        <div class="info-row"><div class="info-label">Courier:</div><div class="info-val">${rma.courier_name || '--'}</div></div>
                                        <div class="info-row"><div class="info-label">Delivered:</div><div class="info-val">${rma.delivery_date || '--'}</div></div>
                                        <hr style="margin: 10px 0;">
                                        <div class="info-row"><div class="info-label">Total TAT:</div><div class="info-val text-danger" style="font-size:15px;"><b>${rma.total_tat}</b></div></div>
                                    </div>
                                </div>
                                <button class="btn btn-light btn-block mt-3 open-sidebar" style="border: 1px dashed #cbd5e1; color: #475569;" data-type="tracking" data-title="${rma.rma_id} Tracking History" data-content="${encodeURIComponent(JSON.stringify(rma.tracking_history))}">🕒 View Full Tracking Timeline</button>
                            </div>
                        </td>
                    </tr>`);
                });
            }
        }
    }

    // --- 7. RENDER COMPONENT TAB ---
    function render_component_view(data) {
        let tbody = $('#component-table tbody').empty();
        let cust_groups = {};
        
        data.forEach(rma => {
            let cust = rma.customer || 'Unknown Customer'; 
            let lot = rma.lot_no || 'Unassigned Lot';
            
            if (!cust_groups[cust]) cust_groups[cust] = { lots: {} };
            if (!cust_groups[cust].lots[lot]) cust_groups[cust].lots[lot] = { count: 0, comp_counts: {} };
            
            cust_groups[cust].lots[lot].count++;
            
            let comps = rma.component_used_init || "";
            if(comps) {
                comps.split(/[,]+/).forEach(c => {
                    let clean = c.trim();
                    if(!clean) return;

                    let match = clean.match(/(.*?)\s*[\[\(]?Qty:\s*(\d+)[\]\)]?/i);
                    let itemName = clean;
                    let itemQty = 1;

                    if (match) {
                        itemName = match[1].trim();
                        itemQty = parseInt(match[2], 10);
                    }

                    let groupKey = itemName.toUpperCase();

                    if (!cust_groups[cust].lots[lot].comp_counts[groupKey]) {
                        cust_groups[cust].lots[lot].comp_counts[groupKey] = {
                            displayName: itemName,
                            totalQty: 0
                        };
                    }
                    
                    cust_groups[cust].lots[lot].comp_counts[groupKey].totalQty += itemQty;
                });
            }
        });

        for (let cust in cust_groups) {
            let cust_id = cust.replace(/[^a-zA-Z0-9]/g, "");
            
            tbody.append(`<tr class="comp-row-customer" style="background:#e2e8f0; font-weight:700; cursor:pointer;" onclick="$('.comp-child-of-${cust_id}').toggle();">
                <td colspan="3"><i class="fa fa-building text-primary mr-2"></i> ${cust}</td>
            </tr>`);

            for (let lot in cust_groups[cust].lots) {
                let info = cust_groups[cust].lots[lot];
                
                let comp_html = '<table class="table table-bordered table-sm mb-0" style="background: white;"><thead><tr><th>Component</th><th width="80px">Total Qty</th></tr></thead><tbody>';
                let has_comps = false;
                
                for(let key in info.comp_counts) {
                    has_comps = true;
                    let compData = info.comp_counts[key];
                    comp_html += `<tr><td>${compData.displayName}</td><td><span class="badge badge-primary">${compData.totalQty}</span></td></tr>`;
                }
                comp_html += '</tbody></table>';
                
                let final_comp = has_comps ? comp_html : '<span class="text-muted">No components used</span>';
                
                tbody.append(`<tr class="comp-child-of-${cust_id}" style="display:none; background:#f8fafc;">
                    <td style="padding-left: 30px;"><i class="fa fa-box text-secondary mr-2"></i> <a href="/app/rma/${lot}">${lot}</a></td>
                    <td><span class="badge badge-info">${info.count} RMAs</span></td>
                    <td style="padding: 10px;">${final_comp}</td>
                </tr>`);
            }
        }
    }

    load_data();
}