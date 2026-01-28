/* MagicMirror Module: MMM-AgeWidget */

Module.register("MMM-AgeWidget", {
  defaults: {
    people: [],
    mode: "adult",
    showYears: null,
    showMonths: null,
    showDays: null,
    title: "Age Widget",
    showTitle: true,
    separator: " — ",
    showOldSuffix: true,
    locale: "en",
    updateInterval: 60 * 60 * 1000,
    updateAtMidnight: true,
    highlightBirthday: true,
    showBirthdayMessage: false,
    birthdayEmoji: "🎂",
    inline: null,
    textAlign: "left",
    events: []
  },

  start: function () {
    this._midnightTimeout = null;
    this._intervalTimer = null;

    if (this.config.updateInterval && this.config.updateInterval > 0) {
      this._intervalTimer = setInterval(() => {
        this.updateDom();
      }, this.config.updateInterval);
    }

    if (this.config.updateAtMidnight) {
      this._scheduleMidnightUpdate();
    }
  },

  suspend: function () {
    if (this._midnightTimeout) {
      clearTimeout(this._midnightTimeout);
      this._midnightTimeout = null;
    }
    if (this._intervalTimer) {
      clearInterval(this._intervalTimer);
      this._intervalTimer = null;
    }
  },

  resume: function () {
    if (this.config.updateInterval && this.config.updateInterval > 0) {
      this._intervalTimer = setInterval(() => {
        this.updateDom();
      }, this.config.updateInterval);
    }
    if (this.config.updateAtMidnight) {
      this._scheduleMidnightUpdate();
    }
  },

  getStyles: function () {
    return ["MMM-AgeWidget.css"];
  },

  getDom: function () {
    const wrapper = document.createElement("div");
    const isInline = this._isInline();
    wrapper.className = isInline ? "age-widget age-widget--inline" : "age-widget";
    wrapper.style.textAlign = this._resolveTextAlign();

    const locale = this._getLocale();

    if (this.config.showTitle && this.config.title && !isInline) {
      const title = document.createElement("div");
      title.className = "age-widget__title";
      title.textContent = this.config.title;
      wrapper.appendChild(title);
    }

    if (!Array.isArray(this.config.people) || this.config.people.length === 0) {
      const empty = document.createElement(isInline ? "span" : "div");
      empty.className = "age-widget__row age-widget__row--empty";
      empty.textContent = locale.noPeople;
      wrapper.appendChild(empty);
      return wrapper;
    }

    const today = this._getLocalDateOnly(new Date());

    this.config.people.forEach((person, index) => {
      const row = document.createElement(isInline ? "span" : "div");
      row.className = isInline ? "age-widget__row age-widget__inline-item" : "age-widget__row";

      const name = document.createElement("span");
      name.className = "age-widget__name";
      name.textContent = person.name || locale.unknown;

      const sep = document.createElement("span");
      sep.className = "age-widget__separator";
      sep.textContent = this.config.separator;

      const text = document.createElement("span");
      text.className = "age-widget__text";

      const dobDate = this._parseISODate(person.dob);
      if (!dobDate) {
        row.classList.add("age-widget__row--error");
        text.textContent = locale.invalidDob;
      } else {
        const age = this._calculateAge(dobDate, today);
        const isBirthday = this._isBirthday(dobDate, today);

        if (isBirthday && this.config.highlightBirthday) {
          row.classList.add("age-widget__row--birthday");
        }

        if (isBirthday && this.config.showBirthdayMessage) {
          text.textContent = `${this.config.birthdayEmoji} ${name.textContent} ${locale.turns} ${age.years} ${this._label("year", age.years)} ${locale.today}`;
        } else {
          const displayConfig = this._resolveDisplay(person);
          const parts = this._formatAgeParts(age, displayConfig);

          if (parts.length === 0) {
            text.textContent = locale.justBorn;
          } else {
            const suffix = this.config.showOldSuffix ? this._oldSuffix(locale) : "";
            text.textContent = `${parts.join(locale.partSeparator)}${suffix}`;
          }
        }
      }

      row.appendChild(name);
      row.appendChild(sep);
      row.appendChild(text);
      wrapper.appendChild(row);

      if (isInline && index < this.config.people.length - 1) {
        const pipe = document.createElement("span");
        pipe.className = "age-widget__inline-separator";
        pipe.textContent = " | ";
        wrapper.appendChild(pipe);
      }
    });

    if (Array.isArray(this.config.events) && this.config.events.length > 0) {
      this.config.events.forEach((event, index) => {
        const row = document.createElement(isInline ? "span" : "div");
        row.className = isInline ? "age-widget__row age-widget__inline-item age-widget__row--event" : "age-widget__row age-widget__row--event";

        const name = document.createElement("span");
        name.className = "age-widget__name";
        name.textContent = event.name || locale.unknown;

        const sep = document.createElement("span");
        sep.className = "age-widget__separator";
        sep.textContent = this.config.separator;

        const textNode = document.createElement("span");
        textNode.className = "age-widget__text";

        const eventDate = this._parseISODate(event.date);
        if (!eventDate) {
          row.classList.add("age-widget__row--error");
          textNode.textContent = locale.invalidDob;
        } else {
          const yearsSince = this._calculateAge(eventDate, today).years;
          const isEventDay = this._isBirthday(eventDate, today);
          if (isEventDay) {
            row.classList.add("age-widget__row--birthday");
            const emoji = event.emoji || this.config.birthdayEmoji;
            if (event.todayText) {
              textNode.textContent = this._formatTemplate(event.todayText, {
                name: name.textContent,
                years: yearsSince
              });
            } else {
              textNode.textContent = `${emoji} ${name.textContent} ${locale.turns} ${yearsSince} ${this._label("year", yearsSince)} ${locale.today}`;
            }
          } else {
            if (event.text) {
              textNode.textContent = this._formatTemplate(event.text, {
                name: name.textContent,
                years: yearsSince
              });
            } else {
              textNode.textContent = `${yearsSince} ${this._label("year", yearsSince)} ${locale.yearsSince}`;
            }
          }
        }

        row.appendChild(name);
        row.appendChild(sep);
        row.appendChild(textNode);
        wrapper.appendChild(row);

        if (isInline && index < this.config.events.length - 1) {
          const pipe = document.createElement("span");
          pipe.className = "age-widget__inline-separator";
          pipe.textContent = " | ";
          wrapper.appendChild(pipe);
        }
      });
    }

    return wrapper;
  },

  _scheduleMidnightUpdate: function () {
    if (this._midnightTimeout) {
      clearTimeout(this._midnightTimeout);
    }

    const now = new Date();
    const next = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1, 0, 0, 5);
    const delay = next.getTime() - now.getTime();

    this._midnightTimeout = setTimeout(() => {
      this.updateDom();
      this._scheduleMidnightUpdate();
    }, delay);
  },

  _getLocalDateOnly: function (date) {
    return new Date(date.getFullYear(), date.getMonth(), date.getDate());
  },

  _isBarPosition: function () {
    const position = this.data && this.data.position;
    return position === "top_bar" || position === "bottom_bar";
  },

  _isInline: function () {
    if (typeof this.config.inline === "boolean") {
      return this.config.inline;
    }
    return this._isBarPosition();
  },

  _resolveTextAlign: function () {
    const value = typeof this.config.textAlign === "string" ? this.config.textAlign.toLowerCase() : "";
    if (value === "left" || value === "right" || value === "center") {
      return value;
    }
    return "left";
  },

  _formatTemplate: function (template, data) {
    if (typeof template !== "string") {
      return "";
    }
    return template.replace(/\{(\w+)\}/g, (match, key) => {
      if (Object.prototype.hasOwnProperty.call(data, key)) {
        return String(data[key]);
      }
      return match;
    });
  },

  _parseISODate: function (value) {
    if (typeof value !== "string") {
      return null;
    }

    const match = value.match(/^(\d{4})-(\d{2})-(\d{2})$/);
    if (!match) {
      return null;
    }

    const year = Number(match[1]);
    const month = Number(match[2]);
    const day = Number(match[3]);

    const date = new Date(year, month - 1, day);
    if (
      Number.isNaN(date.getTime()) ||
      date.getFullYear() !== year ||
      date.getMonth() !== month - 1 ||
      date.getDate() !== day
    ) {
      return null;
    }

    return date;
  },

  _calculateAge: function (dob, today) {
    let years = today.getFullYear() - dob.getFullYear();
    const birthdayThisYear = new Date(dob.getFullYear() + years, dob.getMonth(), dob.getDate());
    if (birthdayThisYear > today) {
      years -= 1;
    }

    let anchor = new Date(dob.getFullYear() + years, dob.getMonth(), dob.getDate());
    let months = (today.getFullYear() - anchor.getFullYear()) * 12 + (today.getMonth() - anchor.getMonth());
    const nextMonth = new Date(anchor.getFullYear(), anchor.getMonth() + months, anchor.getDate());
    if (nextMonth > today) {
      months -= 1;
    }

    anchor = new Date(anchor.getFullYear(), anchor.getMonth() + months, anchor.getDate());

    const msPerDay = 24 * 60 * 60 * 1000;
    const days = Math.round((today.getTime() - anchor.getTime()) / msPerDay);

    return { years, months, days };
  },

  _isBirthday: function (dob, today) {
    return dob.getMonth() === today.getMonth() && dob.getDate() === today.getDate();
  },

  _modePreset: function (mode) {
    switch (mode) {
      case "child":
        return { showYears: true, showMonths: true, showDays: false, keepZeroYears: false };
      case "baby":
        return { showYears: true, showMonths: true, showDays: true, keepZeroYears: true };
      case "adult":
      default:
        return { showYears: true, showMonths: true, showDays: true, keepZeroYears: false };
    }
  },

  _resolveDisplay: function (person) {
    const mode = person.mode || this.config.mode;
    const preset = this._modePreset(mode);

    const showYears = this._resolveBool(person.showYears, this.config.showYears, preset.showYears);
    const showMonths = this._resolveBool(person.showMonths, this.config.showMonths, preset.showMonths);
    const showDays = this._resolveBool(person.showDays, this.config.showDays, preset.showDays);

    return {
      showYears,
      showMonths,
      showDays,
      keepZeroYears: preset.keepZeroYears
    };
  },

  _resolveBool: function (personValue, moduleValue, presetValue) {
    if (typeof personValue === "boolean") {
      return personValue;
    }
    if (typeof moduleValue === "boolean") {
      return moduleValue;
    }
    return presetValue;
  },

  _formatAgeParts: function (age, display) {
    const parts = [];
    const locale = this._getLocale();

    if (display.showYears && (age.years > 0 || display.keepZeroYears)) {
      parts.push(`${age.years} ${this._label("year", age.years)}`);
    }

    if (display.showMonths && age.months > 0) {
      parts.push(`${age.months} ${this._label("month", age.months)}`);
    }

    if (display.showDays && age.days > 0) {
      parts.push(`${age.days} ${this._label("day", age.days)}`);
    }

    if (parts.length === 0 && display.showYears && display.keepZeroYears && age.years === 0) {
      parts.push(`0 ${this._label("year", 0)}`);
    }

    return parts;
  },

  _label: function (unit, value) {
    const locale = this._getLocale();
    const labels = locale.units[unit] || {};
    if (locale.pluralize) {
      return value === 1 ? labels.one : labels.other;
    }
    return labels.other;
  },

  _oldSuffix: function (locale) {
    if (!locale.old) {
      return "";
    }
    return ` ${locale.old}`;
  },

  _getLocale: function () {
    const locales = {
      en: {
        old: "old",
        noPeople: "No people configured",
        invalidDob: "Invalid DOB",
        unknown: "Unknown",
        justBorn: "just born",
        turns: "turns",
        today: "today!",
        yearsSince: "since",
        pluralize: true,
        partSeparator: ", ",
        units: {
          year: { one: "year", other: "years" },
          month: { one: "month", other: "months" },
          day: { one: "day", other: "days" }
        }
      },
      ms: {
        old: "",
        noPeople: "Tiada orang dikonfigurasi",
        invalidDob: "Tarikh lahir tidak sah",
        unknown: "Tidak diketahui",
        justBorn: "baru lahir",
        turns: "genap",
        today: "hari ini!",
        yearsSince: "sejak",
        pluralize: false,
        partSeparator: ", ",
        units: {
          year: { other: "tahun" },
          month: { other: "bulan" },
          day: { other: "hari" }
        }
      }
    };

    return locales[this.config.locale] || locales.en;
  }
});
