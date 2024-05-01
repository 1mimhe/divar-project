const mongoose = require('mongoose');
const slugify = require("slugify");

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
    if (!this.slug) {
        this.slug = slugify(this.name);
    }
});

function autoPopulate(next) {
    this.populate([{ path: "children" }]);
    next();
}
categorySchema.pre(["find", "findOne"], autoPopulate);

categorySchema.virtual("children", {
    ref: "Category",
    localField: "_id",
    foreignField: "parent"
});

categorySchema.statics.findBySlug = async function (slug) {
    return await this.findOne({ slug });
}

const CategoryModel = mongoose.model("Category", categorySchema);
module.exports = CategoryModel;