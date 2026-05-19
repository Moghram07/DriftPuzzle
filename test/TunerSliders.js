/**
 * TunerSliders — Defines all tunable parameters, builds the slider panel,
 * handles reset and export. Writes directly to Config.
 */
class TunerSliders {
    static DEFS = [
        { key:'MAX_SPEED',      label:'Max Speed',        min:2,   max:12,  step:0.5,  g:'Speed & Accel' },
        { key:'REVERSE_SPEED',  label:'Reverse Speed',    min:1,   max:8,   step:0.5,  g:'Speed & Accel' },
        { key:'ACCEL',          label:'Accel Multiplier',  min:0.1, max:3,   step:0.1,  g:'Speed & Accel' },
        { key:'_FWD_ACCEL',     label:'Fwd Accel Rate',   min:0.01,max:0.3, step:0.01, g:'Speed & Accel', hc:0.09 },
        { key:'_REV_ACCEL',     label:'Rev Accel Rate',   min:0.01,max:0.3, step:0.01, g:'Speed & Accel', hc:0.12 },

        { key:'DRIFT',          label:'Drift Factor',     min:0,   max:4,   step:0.1,  g:'Drift & Momentum' },
        { key:'MOMENTUM',       label:'Momentum Str',     min:0,   max:3,   step:0.1,  g:'Drift & Momentum' },
        { key:'FRICTION',       label:'Friction',          min:0.9, max:1,   step:0.005,g:'Drift & Momentum' },
        { key:'_HEADING_DAMP',  label:'Heading Damp',     min:0,   max:0.5, step:0.05, g:'Drift & Momentum', hc:0.2 },
        { key:'_MOM_ACCUM',     label:'Mom Accum ÷',      min:2,   max:30,  step:1,    g:'Drift & Momentum', hc:10 },
        { key:'_MOM_APPLY',     label:'Mom Apply ÷',      min:1,   max:15,  step:0.5,  g:'Drift & Momentum', hc:5 },
        { key:'_MOM_DECAY',     label:'Mom Decay',         min:0.9, max:1,   step:0.005,g:'Drift & Momentum', hc:0.99 },

        { key:'_STEER_RATE',    label:'Steer Rate',       min:0.01,max:0.12,step:0.005,g:'Steering', hc:0.04 },
        { key:'_STEER_MAX',     label:'Steer Max',        min:0.3, max:1.2, step:0.05, g:'Steering', hc:Math.PI/4 },
        { key:'_STEER_RETURN',  label:'Steer Return',     min:0.7, max:1,   step:0.01, g:'Steering', hc:0.92 },

        { key:'_REV_POS_MULT',  label:'Rev Position ×',   min:0.3, max:3,   step:0.1,  g:'Reverse', hc:1 },
        { key:'_REV_TURN_MULT', label:'Rev Turn ×',       min:0.3, max:4,   step:0.1,  g:'Reverse', hc:1.2 },
        { key:'_REV_SPEED_DAMP',label:'Rev Speed Damp',   min:0,   max:0.5, step:0.05, g:'Reverse', hc:0.15 },

        { key:'_JT_NOSE_WHIP',  label:'JT Nose Whip',    min:1.0, max:3.0, step:0.1,  g:'J-Turn', hc:1.0 },

        { key:'SPIN_OUT_THRESHOLD',         label:'Spinout Phi',   min:0.2,max:1.5,step:0.05,g:'Spin-out' },
        { key:'SPIN_OUT_SPEED_THRESHOLD',   label:'Spinout Speed', min:1,  max:10, step:0.5, g:'Spin-out' },
        { key:'SPIN_OUT_MOMENTUM_THRESHOLD',label:'Spinout Mom',   min:2,  max:15, step:0.5, g:'Spin-out' },
    ];

    static _defaults = {};

    static init(panelEl) {
        for (const s of this.DEFS) {
            if (s.hc !== undefined) Config[s.key] = s.hc;
            this._defaults[s.key] = Config[s.key];
        }
        this._buildPanel(panelEl);
    }

    static _buildPanel(el) {
        let lg = '';
        for (const s of this.DEFS) {
            if (s.g !== lg) {
                lg = s.g;
                const h = document.createElement('div');
                h.className = 'gtitle'; h.textContent = s.g;
                el.appendChild(h);
            }
            const r = document.createElement('div'); r.className = 'sr';
            const l = document.createElement('label'); l.textContent = s.label;
            const i = document.createElement('input');
            i.type='range'; i.min=s.min; i.max=s.max; i.step=s.step; i.value=Config[s.key];
            const pr = s.step < 0.01 ? 3 : s.step < 0.1 ? 2 : 1;
            const v = document.createElement('span'); v.className='v';
            v.textContent = Number(Config[s.key]).toFixed(pr);
            i.oninput = () => { Config[s.key]=parseFloat(i.value); v.textContent=Number(i.value).toFixed(pr); };
            r.appendChild(l); r.appendChild(i); r.appendChild(v);
            el.appendChild(r);
        }
        const br = document.createElement('div'); br.className='btns';
        const rb = document.createElement('button'); rb.textContent='Reset All'; rb.className='w';
        rb.onclick = () => this.resetAll(el);
        const eb = document.createElement('button'); eb.textContent='Export';
        eb.onclick = () => this.exportConfig();
        br.appendChild(rb); br.appendChild(eb); el.appendChild(br);
    }

    static resetAll(el) {
        for (const s of this.DEFS) Config[s.key] = this._defaults[s.key];
        el.querySelectorAll('.sr').forEach((r, i) => {
            const s = this.DEFS[i], inp=r.querySelector('input'), v=r.querySelector('.v');
            const pr = s.step<0.01?3:s.step<0.1?2:1;
            inp.value=Config[s.key]; v.textContent=Number(Config[s.key]).toFixed(pr);
        });
    }

    static exportConfig() {
        let o = '// Tuned values\n';
        for (const s of this.DEFS) {
            const c = Config[s.key] !== this._defaults[s.key];
            o += `${s.key}: ${Config[s.key]},${c?' // ★':''}\n`;
        }
        navigator.clipboard.writeText(o).then(()=>alert('Copied!')); console.log(o);
    }
}