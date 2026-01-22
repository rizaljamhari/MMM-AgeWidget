# MMM-AgeWidget

MagicMirror² frontend-only module that displays age rows for multiple people with accurate year/month/day calculations.

## Installation

1) Copy the `MMM-AgeWidget` folder into your MagicMirror `modules` directory.
2) Add the module to your `config.js`.

## Configuration

**Module config options**

- `people` (array): list of people
  - `name` (string)
  - `dob` (string) in `YYYY-MM-DD`
  - `mode` (optional string): `adult` | `child` | `baby`
  - `showYears` / `showMonths` / `showDays` (optional booleans): per-person overrides
- `mode` (string): default mode for people without a per-person mode
- `showYears` / `showMonths` / `showDays` (boolean|null): global defaults (overridden by person)
- `title` (string)
- `showTitle` (boolean)
- `separator` (string): default `" — "`
- `showOldSuffix` (boolean)
- `inline` (boolean|null): override auto inline mode for `top_bar`/`bottom_bar` when set
- `textAlign` (string): `left`, `center`, or `right`
- Inline bar layout: auto-enabled for `top_bar` and `bottom_bar`, uses ` | ` between people and hides the title
- `locale` (string): `en` or `ms`
- `updateInterval` (number ms): periodic refresh, default ~1 hour
- `updateAtMidnight` (boolean): update at local midnight
- `highlightBirthday` (boolean)
- `showBirthdayMessage` (boolean): replace line with birthday message
- `birthdayEmoji` (string): default `"🎂"`

## Examples

### 1) Adult with years + months + days

```js
{
  module: "MMM-AgeWidget",
  position: "top_left",
  config: {
    title: "Ages",
    mode: "adult",
    people: [
      { name: "Rizal", dob: "1993-01-28" }
    ]
  }
}
```

### 2) Child with years + months only

```js
{
  module: "MMM-AgeWidget",
  position: "top_left",
  config: {
    mode: "child",
    people: [
      { name: "Yuna", dob: "2022-06-04" }
    ]
  }
}
```

### 3) Baby with years + months + days, keep 0 years

```js
{
  module: "MMM-AgeWidget",
  position: "top_left",
  config: {
    mode: "baby",
    people: [
      { name: "Aria", dob: "2024-11-01" }
    ]
  }
}
```

### 4) Malay locale example

```js
{
  module: "MMM-AgeWidget",
  position: "top_left",
  config: {
    locale: "ms",
    showOldSuffix: false,
    people: [
      { name: "Aiman", dob: "1990-03-10" }
    ]
  }
}
```

## Notes

- Date of birth must be `YYYY-MM-DD`.
- Ages are calculated using calendar-aware year/month/day logic (leap years and month lengths handled).
- The module updates at local midnight when `updateAtMidnight` is true.
- `top_bar` and `bottom_bar` positions render inline with a ` | ` separator between people and no title (override with `inline`).
