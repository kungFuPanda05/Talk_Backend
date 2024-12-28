export default {
    prepareWhereCondition(fields, data) {
        const whereCondition = {};

        // Map fields to corresponding data values
        fields.forEach(field => {
            if (data.hasOwnProperty(field)) {
                whereCondition[field] = data[field];
            }
        });

        return whereCondition;
    },

    async createUnique(table, data, transaction = null) {
        try {
            let record = await table.create(data, { transaction });
            return [record, true, "Created Successfully"];
        } catch (error) {
            if (error.name === "SequelizeUniqueConstraintError") {
                let fields = error.errors.map(e => e.path);
                let tempArray = [];
                for(let field of fields){
                    for(let subField of field.split('_')) tempArray.push(subField);
                }
                fields = tempArray;
                // Fetch the record, including soft-deleted ones
                const record = await table.findOne({
                    attributes: ['id', 'deletedAt'],
                    paranoid: false,
                    where: this.prepareWhereCondition(fields, data),
                    raw: true
                });
    
                if (record) {
                    if (record.deletedAt) {
                        // Restore the soft-deleted record
                        await table.update(
                            { ...data, deletedAt: null }, 
                            { where: { id: record.id }, paranoid: false, transaction }
                        );
                        return [record, true, "Created Successfully"];
                    } else {
                        return [record, false, `${fields.join(", ")} already exists`];
                    }
                } else {
                    throw new RequestError("Unexpected database inconsistency");
                }
            } else {
                // Re-throw other types of errors
                throw new RequestError(error);
            }
        }
    }
    
};
