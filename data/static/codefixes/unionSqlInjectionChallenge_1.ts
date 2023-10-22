module.exports = function searchProducts() {
  return (req, res, next) => {
    let criteria = req.query.q || '';
    criteria = criteria.substring(0, 200);

    models.Product.findAll({
      where: {
        deletedAt: null,
        [Op.or]: [
          {
            name: {
              [Op.like]: `%${criteria}%`
            }
          },
          {
            description: {
              [Op.like]: `%${criteria}%`
            }
          }
        ]
      },
      order: ['name']
    })
      .then((products) => {
        const sanitizedProducts = products.map((product) => {
          return {
            name: req.__(product.name),
            description: req.__(product.description)
          };
        });
        res.json(sanitizedProducts);
      })
      .catch((error) => {
        next(error);
      });
  }
}
