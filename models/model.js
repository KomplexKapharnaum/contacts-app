// Base model class
//

import db from '../tools/db.js';

class Model {
    constructor(table, fields) {
        this.table = table;
        this.fields = fields;
        this.clear()
    }

    clear() {
        for (let key in this.fields) this.fields[key] = null;
    }

    async new(f) {
        this.clear()
        for (let key in f) 
            if (this.fields[key] !== undefined) this.fields[key] = f[key];
        await this.save();
        return this.export()
    }

    async save() {
        // Insert or Update
        if (!this.fields.id) {
            let id = await db(this.table).insert(this.fields);
            this.fields.id = id[0];
            console.log(this.table, this.fields.id, 'created');
        } else {
            await db(this.table).where({ id: this.fields.id }).update(this.fields);
            console.log(this.table, this.fields.id, 'updated');
        }
    }

    async load(w) {
        this.clear();
        if (typeof w === 'number') w = { id: w };
        let item = await db(this.table).where(w).first();
        if (item) this.fields = item;
        else throw new Error('Item '+ JSON.stringify(w) +' not found in '+ this.table);
    }

    async delete(w) {
        if (w) await this.load(w)
        if (!this.fields.id) throw new Error('id not found');
        await db(this.table).where({ id: this.fields.id }).del();
        console.log(this.table, this.fields.id, 'deleted');
    }

    async update(w, f) {
        if (w) await this.load(w);
        for (let key in f) 
            if (this.fields[key] !== undefined) this.fields[key] = f[key];
        await this.save();
    }

    async list(w) {
        if (w) return db(this.table).where(w);
        else return db(this.table).select();
    }

    async export() {
        return JSON.parse(JSON.stringify(this.fields));
    }

    id() {
        return this.fields.id;
    }
}


export default Model;