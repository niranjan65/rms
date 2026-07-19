frappe.pages['RMA Dashboard'].on_page_load = function(wrapper) {

    console.log("RMA Dashboard Loaded ✅");

    setTimeout(() => {

        let style = document.createElement("style");

        style.innerHTML = `
        
        /* Target workspace cards */
        .workspace .widget,
        .workspace .widget-card,
        .workspace .number-card {

            position: relative;
            border-radius: 12px;
            overflow: hidden;
        }

        .workspace .widget::before,
        .workspace .widget-card::before,
        .workspace .number-card::before {

            content: "";
            position: absolute;
            inset: 0;
            padding: 2px;
            border-radius: 12px;

            background: linear-gradient(90deg, red, yellow, green, blue, red);
            background-size: 300% 300%;
            animation: moveBorder 3s linear infinite;

            -webkit-mask:
                linear-gradient(#fff 0 0) content-box,
                linear-gradient(#fff 0 0);
            -webkit-mask-composite: xor;
            mask-composite: exclude;
        }

        @keyframes moveBorder {
            0% { background-position: 0% }
            100% { background-position: 100% }
        }
        `;

        document.head.appendChild(style);

    }, 1000); // wait for dashboard render
};