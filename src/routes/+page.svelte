<script>
    import GitHubCat from "../components/GitHubCat.svelte";
    import ModeSwitch from "../components/ModeSwitch.svelte";
    import ButtonBar from "../components/ButtonBar.svelte";
    import {onMount} from "svelte";
    import {jsPDF} from "jspdf";

    let logo;

    function zeroArgs() {
        return {
            mode: "bgp",
            logoURL: "",

            networkName: "",
            peerName: "",

            contactName: "",
            contactEmail: "",
            contactPhone: "",
            date: "",
            notes: "",

            bgp: {
                asn: "",
                peerASN: "",
                prefixes: "",
            },

            xc: {
                facility: "",
                mediaType: "",
                tiedown: "",
            },
        };
    }

    let args = zeroArgs();

    let isMounted = false;
    onMount(() => {
        isMounted = true;
    })
    $: {
        if (isMounted) {
            let params = new URLSearchParams();
            setParams(params, args, "");
            window.history.replaceState({}, "", window.location.pathname + "?" + params.toString());
        }
    }

    function setParams(params, cfg, prefix) {
        Object.keys(cfg).forEach(key => {
            if (key === "date" || (key === "mode" && cfg[key] === "bgp")) return;
            if (typeof cfg[key] === "object") {
                setParams(params, cfg[key], prefix + key + ".");
            } else if (cfg[key] !== "") {
                params.set(prefix + key, cfg[key]);
            }
        });
    }

    function setArgs(params, cfg, prefix) {
        Object.keys(cfg).forEach(key => {
            if (typeof cfg[key] === "object") {
                setArgs(params, cfg[key], prefix + key + ".");
            } else {
                if (params.has(prefix + key)) {
                    cfg[key] = params.get(prefix + key);
                }
            }
        });
    }

    function reset() {
        args = zeroArgs();
        logo.src = "";
        logo.style.display = "none";

        args.date = new Date().toISOString().split("T")[0];
    }

    onMount(() => {
        reset();
        let params = new URLSearchParams(new URL(window.location.href).search);
        setArgs(params, args, "");
        if (args.logoURL !== "") {
            logo.src = args.logoURL;
            logo.style.display = "block";
        }
    });

    function loadPeeringDB() {
        if (args.bgp.asn !== "") {
            fetch("https://www.peeringdb.com/api/net?asn=" + args.bgp.asn)
                .then(resp => resp.json())
                .then(data => {
                    if (data.data.length === 1) {
                        args.networkName = data.data[0].name;
                    }
                });
        }

        if (args.bgp.peerASN !== "") {
            fetch("https://www.peeringdb.com/api/net?asn=" + args.bgp.peerASN)
                .then(resp => resp.json())
                .then(data => {
                    if (data.data.length === 1) {
                        args.peerName = data.data[0].name;
                    }
                });
        }
    }

    function loadImage(e) {
        logo.style.display = "block";

        let reader = new FileReader();
        reader.onload = function (event) {
            logo.src = event.target.result;
        }
        reader.readAsDataURL(e.target.files[0]);
    }

    function opening() {
        return new Date(args.date).toLocaleDateString() + `

To whom it may concern,

`
    }

    function conclusion() {
        return `${args.notes === "" ? "" : "\n" + args.notes + "\n"}
This document certifies that I am authorized to execute this Letter of Authorization (LoA). Authorization may be revoked at any time by ${args.networkName}. Should you have questions about this request, email ${args.contactEmail}${args.contactPhone !== "" ? " or call " + args.contactPhone : ""}.

Sincerely,
${args.contactName}
`
    }

    function generateBGP() {
        return `This letter serves to authorize AS${args.bgp.peerASN} (${args.peerName}) to announce the following IP address blocks:

${args.bgp.prefixes}
`
    }

    function generateXC() {
        return `This letter serves to authorize ${args.peerName} for the limited purpose of installing a cross connect to ${args.networkName}.

Facility: ${args.xc.facility}
Tiedown: ${args.xc.tiedown}
Media Type: ${args.xc.mediaType}
`
    }

    function validateForm() {
        let ok = true;
        document.getElementById("form").querySelectorAll("[required]").forEach(function (i) {
            if (!ok) return;
            if (!i.value || i.value === "") ok = false;
        })
        if (!ok) {
            alert("Please complete all required fields");
        }
        return ok;
    }

    function generate() {
        return opening() + (args.mode === "bgp" ? generateBGP() : generateXC()) + conclusion();
    }

    function filename() {
        let today = new Date();
        return `LoA-${args.peerName.toUpperCase().replace(/[^a-z0-9]/gi, '-')}-${today.getMonth() + 1}-${today.getDate()}-${today.getFullYear()}`
    }

    function savePDF() {
        if (!validateForm()) return;

        let doc = new jsPDF();

        let headerHeight = 20;
        let bodyHeight = 30;

        // Image
        if (logo.src !== "") {
            headerHeight = 50;
            bodyHeight = 60;

            let targetHeight = 20;
            let targetWidth = (logo.clientWidth / logo.clientHeight) * targetHeight;
            doc.addImage(logo.src, "JPEG", 20, 20, targetWidth, targetHeight, "", "NONE", 0)
        }

        doc.setFontSize(20);
        doc.text("Letter of Authorization", 20, headerHeight);

        doc.setFontSize(12);
        doc.text(doc.splitTextToSize(generate(), 180), 20, bodyHeight);
        doc.save(filename() + ".pdf");
    }
</script>

<svelte:head>
    <title>LoA Generator</title>
    <link rel="stylesheet" href="water.min.css">
</svelte:head>

<main>
    <GitHubCat/>

    <h1>LoA Generator</h1>

    <div id="form">
        <ModeSwitch bind:value={args.mode}/>

        {#if args.mode === "bgp"}
            <label>
                ASN*
                <input bind:value={args.bgp.asn} on:blur={loadPeeringDB} placeholder="65530" required type="number">
            </label>

            <label>
                Peer ASN*
                <input bind:value={args.bgp.peerASN} on:blur={loadPeeringDB} placeholder="65531" required type="number">
            </label>

            <br>
        {/if}

        <label>
            Network Name*
            <input bind:value={args.networkName} required type="text">
        </label>

        <label>
            Peer Name*
            <input bind:value={args.peerName} required type="text">
        </label>

        {#if args.mode === "xc"}
            <br>

            <label>
                Facility*
                <input bind:value={args.xc.facility} type="text" placeholder="921 SW Washington St" required>
            </label>

            <label>
                Media Type
                <input bind:value={args.xc.mediaType} type="text" placeholder="SMF LC-UPC Duplex">
            </label>

            <br>

            <label class="wide">
                Tiedown*
                <input style="width: calc(100% - 26px)" bind:value={args.xc.tiedown} placeholder="MMR-A: 1.49, Port A4" type="text" required>
            </label>
        {/if}

        <br>

        <label>
            Contact Name*
            <input bind:value={args.contactName} placeholder="John Doe" required type="text">
        </label>

        <label>
            Contact Email*
            <input bind:value={args.contactEmail} placeholder="noc@example.com" required type="email">
        </label>

        <br>

        <label>
            Contact Phone
            <input bind:value={args.contactPhone} placeholder="+1 (123) 456 7890" type="text">
        </label>

        <label>
            Date*
            <input bind:value={args.date} required type="date">
        </label>

        <br>

        {#if args.mode === "bgp"}
            <label>
                Prefixes*
                <textarea bind:value={args.bgp.prefixes} placeholder="192.0.2.0/24" required></textarea>
            </label>
        {/if}

        <label class="wide">
            Notes
            <textarea rows="4" bind:value={args.notes}></textarea>
        </label>

        <br>

        <label>
            Network Logo
            <input alt="Network Logo" type="file" on:change={loadImage}/>
        </label>

        <img bind:this={logo} alt="Network logo" style="display: none"/>

        <ButtonBar {savePDF} {reset}/>
    </div>
</main>

<style>
    main {
        display: flex;
        flex-direction: column;
        align-items: center;
    }

    img {
        max-width: 400px;
    }

    h1 {
        margin: 25px;
    }

    .wide {
        width: 100% !important;
    }
</style>
