<script>
    export let savePDF = () => {
    };

    export let reset = () => {
    };
</script>

<main>
    <button on:click={savePDF}>
        <span>Download PDF</span>
        <svg class="i-import" fill="none" height="16" stroke="currentcolor" stroke-linecap="round" stroke-linejoin="round" stroke-width="2" viewBox="0 0 32 32" width="16">
            <path d="M28 22 L28 30 4 30 4 22 M16 4 L16 24 M8 16 L16 24 24 16"></path>
        </svg>
    </button>

    <button on:click={reset}>
        <span>Reset</span>
        <svg class="i-trash" fill="none" height="16" stroke="currentcolor" stroke-linecap="round" stroke-linejoin="round" stroke-width="2" viewBox="0 0 32 32" width="16">
            <path d="M28 6 L6 6 8 30 24 30 26 6 4 6 M16 12 L16 24 M21 12 L20 24 M11 12 L12 24 M12 6 L13 2 19 2 20 6"></path>
        </svg>
    </button>
</main>

<style>
    main {
        display: flex;
        justify-content: space-around;
        margin-top: 25px;
    }

    button {
        display: flex;
        flex-direction: row;
        align-items: center;
        justify-content: center;
        margin: 0 !important;
    }

    span {
        margin-right: 10px;
    }
</style>
