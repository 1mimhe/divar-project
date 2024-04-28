const mongoose = require('mongoose');

const categorySchema = new mongoose.Schema({
    name: {type: String, required: true},
    slug: {type: String, required: false, index: true},
    icon: {type: String, required: true},
    parent: {type: mongoose.Types.ObjectId, ref: "Category", required: false},
    parents: {type: [mongoose.Types.ObjectId], required: false, default: []}
}, {
    versionKey: false,
    id: false,
    toJSON: {
        virtuals: true
    }
});

categorySchema.pre("save", function () {
    const name = this.name;
    this.slug = name.replace(/\s+/g, ' ').trim();
});

categorySchema.virtual("children", {
    ref: "Category",
    localField: "_id",
    foreignField: "parent"
});

const CategoryModel = mongoose.model("Category", categorySchema);
module.exports = CategoryModel;