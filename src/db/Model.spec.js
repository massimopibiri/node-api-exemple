import Sequelize, { DataTypes } from 'sequelize'
import Model         from './Model'

class CustomModel extends Model {
  static init (sequelize) {
    return super.init({
      sequelize,
      tableName: 'test_model_inheritance',
      timestamps: true,
      underscored: true,
      paranoid: true,
    })
  }

  static get modelAttributes () {
    return {
      id: {
        type: DataTypes.UUID,
        defaultValue: DataTypes.UUIDV4,
        primaryKey: true,
      },

      foreign_id: {
        type: DataTypes.UUID,
        allowNull: true,
      },
      user_id: {
        type: DataTypes.UUID,
        allowNull: true,
        graphName: 'author',
        graphType: 'User',
      },

      public_field: {
        type: DataTypes.STRING,
        allowNull: false,
      },
      public_null_field: {
        type: 'citext',
        allowNull: true,
        readOnly: true,
      },
      public_search_field: {
        type: DataTypes.INTEGER,
        allowNull: false,
        defaultValue: 42,
        search: true,
      },
      public_date_field: {
        type: DataTypes.DATE,
        allowNull: false,
        search: true,
      },
      public_enum_field: {
        type: Sequelize.ENUM,
        allowNull: false,
        values: ['foo', 'bar'],
      },

      private_field: {
        type: DataTypes.STRING,
        readOnly: true,
        private: true,
      },
      private_virtual_field: {
        type: DataTypes.VIRTUAL,
        private: true,
      },
      private_mandatory_field: {
        type: DataTypes.STRING,
        allowNull: false,
        private: true,
      },

      restricted_field: {
        type: DataTypes.STRING,
        readOnly: true,
        restricted: true,
      },

      created_at: {
        type: DataTypes.DATE,
        allowNull: false,
        readOnly: true,
        restricted: true,
      },
      updated_at: {
        type: DataTypes.DATE,
        allowNull: false,
        readOnly: true,
        restricted: true,
      },
      deleted_at: {
        type: DataTypes.DATE,
        allowNull: true,
        readOnly: true,
        restricted: true,
      },
    }
  }
}

// const graphSchemaSample =
// `enum CustomModelPublicEnumField {
//   foo
//   bar
// }

// type CustomModel {
//   id: UUID
//   foreign: Foreign
//   author: User
//   public_field: String!
//   public_null_field: String
//   public_search_field: Int
//   public_date_field: Date!
//   public_enum_field: CustomModelPublicEnumField!
// }\n`

class MissingAttributesModel extends Model {
  static init (sequelize) {
    return super.init({
      sequelize,
      tableName: 'test_model_inheritance_2',
      timestamps: true,
      underscored: true,
      paranoid: true,
    })
  }
}

describe('Model Class Inheritance', () => {
  context('A model inheriting Model Class', () => {
    it('should implement the modelAttributes getter', () => {
      try {
        MissingAttributesModel.publicAttributes
      } catch (error) {
        error.name.should.equal('Error')
        error.message.should.equal('attributes not defined')
      }
    })

    it('should return public attributes', () => {
      CustomModel.publicAttributes.should.deep.equal([
        'id',
        'foreign_id',
        'user_id',
        'public_field',
        'public_null_field',
        'public_search_field',
        'public_date_field',
        'public_enum_field',
      ])
    })

    it('should return owner readable attributes', () => {
      CustomModel.ownerAttributes.should.deep.equal([
        'id',
        'foreign_id',
        'user_id',
        'public_field',
        'public_null_field',
        'public_search_field',
        'public_date_field',
        'public_enum_field',
        'private_field',
        'private_mandatory_field',
      ])
    })


    it('should return mandatories attributes', () => {
      CustomModel.mandatoryAttributes.should.deep.equal([
        'public_field',
        'public_date_field',
        'public_enum_field',
        'private_virtual_field',
        'private_mandatory_field',
      ])
    })

    it('should return searchable attributes', () => {
      CustomModel.searchableAttributes.should.deep.equal([
        'public_search_field',
        'public_date_field',
      ])
    })

    it('should return editable attributes', () => {
      CustomModel.editableAttributes.should.deep.equal([
        'public_field',
        'public_search_field',
        'public_date_field',
        'public_enum_field',
        'private_virtual_field',
        'private_mandatory_field',
      ])
    })

    // it('should return a model graphQL schema', () => {
    //   CustomModel.graphSchema.should.equal(graphSchemaSample)
    // })
  })
})
