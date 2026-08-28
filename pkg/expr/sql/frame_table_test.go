//go:build !arm

package sql

import (
	"testing"
	"time"

	"github.com/dolthub/go-mysql-server/sql/types"
	"github.com/grafana/grafana-plugin-sdk-go/data"
	"github.com/stretchr/testify/require"
)

func TestSchemaFromFrame(t *testing.T) {
	frame := data.NewFrame("",
		data.NewField("time", nil, []time.Time{time.Unix(1, 0)}),
		data.NewField("time_nullable", nil, []*time.Time{nil}),
		data.NewField("string", nil, []string{"a"}),
		data.NewField("string_nullable", nil, []*string{nil}),
		data.NewField("bool", nil, []bool{true}),
		data.NewField("bool_nullable", nil, []*bool{nil}),
		data.NewField("float32", nil, []float32{1}),
		data.NewField("float32_nullable", nil, []*float32{nil}),
		data.NewField("float64", nil, []float64{1}),
		data.NewField("float64_nullable", nil, []*float64{nil}),
		data.NewField("int8", nil, []int8{1}),
		data.NewField("int8_nullable", nil, []*int8{nil}),
		data.NewField("int16", nil, []int16{1}),
		data.NewField("int16_nullable", nil, []*int16{nil}),
		data.NewField("int32", nil, []int32{1}),
		data.NewField("int32_nullable", nil, []*int32{nil}),
		data.NewField("int64", nil, []int64{1}),
		data.NewField("int64_nullable", nil, []*int64{nil}),
		data.NewField("uint8", nil, []uint8{1}),
		data.NewField("uint8_nullable", nil, []*uint8{nil}),
		data.NewField("uint16", nil, []uint16{1}),
		data.NewField("uint16_nullable", nil, []*uint16{nil}),
		data.NewField("uint32", nil, []uint32{1}),
		data.NewField("uint32_nullable", nil, []*uint32{nil}),
		data.NewField("uint64", nil, []uint64{1}),
		data.NewField("uint64_nullable", nil, []*uint64{nil}),
	).SetRefID("InputRef")

	schema := SchemaFromFrame(frame)
	require.Len(t, schema, len(frame.Fields))

	want := []struct {
		name     string
		mysqlTyp string
		nullable bool
	}{
		{"time", types.Timestamp.String(), false},
		{"time_nullable", types.Timestamp.String(), true},
		{"string", types.Text.String(), false},
		{"string_nullable", types.Text.String(), true},
		{"bool", types.Boolean.String(), false},
		{"bool_nullable", types.Boolean.String(), true},
		{"float32", types.Float32.String(), false},
		{"float32_nullable", types.Float32.String(), true},
		{"float64", types.Float64.String(), false},
		{"float64_nullable", types.Float64.String(), true},
		{"int8", types.Int8.String(), false},
		{"int8_nullable", types.Int8.String(), true},
		{"int16", types.Int16.String(), false},
		{"int16_nullable", types.Int16.String(), true},
		{"int32", types.Int32.String(), false},
		{"int32_nullable", types.Int32.String(), true},
		{"int64", types.Int64.String(), false},
		{"int64_nullable", types.Int64.String(), true},
		{"uint8", types.Uint8.String(), false},
		{"uint8_nullable", types.Uint8.String(), true},
		{"uint16", types.Uint16.String(), false},
		{"uint16_nullable", types.Uint16.String(), true},
		{"uint32", types.Uint32.String(), false},
		{"uint32_nullable", types.Uint32.String(), true},
		{"uint64", types.Uint64.String(), false},
		{"uint64_nullable", types.Uint64.String(), true},
	}

	for i, col := range schema {
		require.Equal(t, want[i].name, col.Name, "column %d name", i)
		require.Equal(t, want[i].mysqlTyp, col.Type.String(), "column %d mysql type", i)
		require.Equal(t, want[i].nullable, col.Nullable, "column %d nullable", i)
		require.Equal(t, "inputref", col.Source, "column %d source is lowercase frame RefID", i)

		fT, err := MySQLColToFieldType(col)
		require.NoError(t, err, "column %d MySQLColToFieldType", i)
		require.NotEqual(t, data.FieldTypeUnknown, fT, "column %d field type", i)
	}
}

func TestSchemaFromFrameEmpty(t *testing.T) {
	frame := data.NewFrame("").SetRefID("A")
	schema := SchemaFromFrame(frame)
	require.Empty(t, schema)
}
